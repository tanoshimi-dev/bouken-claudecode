import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type {
  FreshnessSummary,
  ToolDetail,
  ToolVersionDetail,
  VersionImpact,
  RecentUpdate,
  VersionCheckResult,
} from '@learn-ai/shared-types';

type ToolSlugType = FreshnessSummary['tools'][number]['toolSlug'];
type ImpactStatusType = VersionImpact['status'];
type ImpactPriorityType = VersionImpact['priority'];

function mapImpact(i: {
  id: string;
  moduleId: string;
  lessonId: string | null;
  impactDescription: string | null;
  status: string;
  priority: string;
  module: { title: string };
  lesson: { title: string } | null;
}): VersionImpact {
  return {
    id: i.id,
    moduleId: i.moduleId,
    moduleTitle: i.module.title,
    lessonId: i.lessonId,
    lessonTitle: i.lesson?.title ?? null,
    status: i.status as ImpactStatusType,
    priority: i.priority as ImpactPriorityType,
    impactDescription: i.impactDescription,
  };
}

export class UpdateTrackerService {
  // ── Public: Freshness Summary ──────────────────────────

  async getFreshnessSummary(): Promise<FreshnessSummary> {
    const configs = await prisma.toolTrackingConfig.findMany({
      include: {
        versions: {
          orderBy: { releaseDate: 'desc' },
          take: 1,
          select: { version: true },
        },
      },
    });

    const tools: FreshnessSummary['tools'] = [];

    for (const config of configs) {
      const latestVersion = config.versions[0]?.version ?? config.currentContentVersion;
      const { pending, inProgress } = await this.countUnresolvedImpacts(config.toolSlug);
      const totalLessons = await this.countToolLessons();
      const freshness = this.calculateFreshness(totalLessons, pending + inProgress);

      tools.push({
        toolSlug: config.toolSlug as ToolSlugType,
        displayName: config.displayName,
        freshness,
        latestVersion,
        contentVersion: config.currentContentVersion,
        pendingUpdates: pending + inProgress,
      });
    }

    let lastChecked: Date | null = null;
    for (const c of configs) {
      if (c.lastCheckedAt && (!lastChecked || c.lastCheckedAt > lastChecked)) {
        lastChecked = c.lastCheckedAt;
      }
    }

    const overallFreshness = this.calculateOverallFreshness(
      tools.map((t) => ({ freshness: t.freshness, lessonCount: 1 })),
    );

    return {
      overallFreshness,
      lastChecked: lastChecked?.toISOString() ?? null,
      tools,
    };
  }

  // ── Public: Tool Detail ────────────────────────────────

  async getToolDetail(toolSlug: string): Promise<ToolDetail> {
    const config = await prisma.toolTrackingConfig.findUnique({
      where: { toolSlug },
    });

    if (!config) {
      throw new AppError(404, 'Tool not found');
    }

    const versions = await prisma.toolVersion.findMany({
      where: { toolSlug },
      orderBy: { releaseDate: 'desc' },
      include: {
        impacts: {
          include: {
            module: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
      },
    });

    const mappedVersions: ToolVersionDetail[] = [];
    for (const v of versions) {
      mappedVersions.push({
        id: v.id,
        version: v.version,
        releaseDate: v.releaseDate.toISOString().split('T')[0],
        summary: v.summary,
        changes: v.changes as unknown as ToolVersionDetail['changes'],
        breakingChanges: v.breakingChanges,
        changelogUrl: v.changelogUrl,
        impacts: v.impacts.map(mapImpact),
      });
    }

    return {
      tool: {
        toolSlug: config.toolSlug as ToolSlugType,
        displayName: config.displayName,
        currentContentVersion: config.currentContentVersion,
        changelogUrl: config.changelogUrl,
        documentationUrl: config.documentationUrl,
        lastCheckedAt: config.lastCheckedAt?.toISOString() ?? null,
      },
      versions: mappedVersions,
    };
  }

  // ── Public: Version Detail ─────────────────────────────

  async getVersionDetail(toolSlug: string, versionId: string): Promise<ToolVersionDetail> {
    const version = await prisma.toolVersion.findFirst({
      where: { id: versionId, toolSlug },
      include: {
        impacts: {
          include: {
            module: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
      },
    });

    if (!version) {
      throw new AppError(404, 'Version not found');
    }

    return {
      id: version.id,
      version: version.version,
      releaseDate: version.releaseDate.toISOString().split('T')[0],
      summary: version.summary,
      changes: version.changes as unknown as ToolVersionDetail['changes'],
      breakingChanges: version.breakingChanges,
      changelogUrl: version.changelogUrl,
      impacts: version.impacts.map(mapImpact),
    };
  }

  // ── Public: Recent Updates ─────────────────────────────

  async getRecentUpdates(limit = 10): Promise<RecentUpdate[]> {
    const versions = await prisma.toolVersion.findMany({
      orderBy: { releaseDate: 'desc' },
      take: limit,
      include: {
        tool: { select: { displayName: true } },
        _count: { select: { impacts: true } },
        impacts: {
          where: { status: 'updated' },
          select: { id: true },
        },
      },
    });

    const results: RecentUpdate[] = [];
    for (const v of versions) {
      results.push({
        id: v.id,
        toolSlug: v.toolSlug as ToolSlugType,
        displayName: v.tool.displayName,
        version: v.version,
        releaseDate: v.releaseDate.toISOString().split('T')[0],
        summary: v.summary,
        breakingChanges: v.breakingChanges,
        impactCount: v._count.impacts,
        resolvedCount: v.impacts.length,
      });
    }

    return results;
  }

  // ── Admin: Create Version ──────────────────────────────

  async createVersion(data: {
    toolSlug: string;
    version: string;
    releaseDate: string;
    summary: string;
    changes: { type: string; description: string }[];
    breakingChanges: boolean;
    changelogUrl?: string;
  }) {
    const config = await prisma.toolTrackingConfig.findUnique({
      where: { toolSlug: data.toolSlug },
    });
    if (!config) {
      throw new AppError(404, 'Tool not found');
    }

    return prisma.toolVersion.create({
      data: {
        toolSlug: data.toolSlug,
        version: data.version,
        releaseDate: new Date(data.releaseDate),
        summary: data.summary,
        changes: data.changes,
        breakingChanges: data.breakingChanges,
        changelogUrl: data.changelogUrl,
      },
    });
  }

  // ── Admin: Create Impacts ──────────────────────────────

  async createImpacts(
    versionId: string,
    impacts: {
      moduleId: string;
      lessonId?: string;
      impactDescription?: string;
      priority: string;
    }[],
  ) {
    const version = await prisma.toolVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new AppError(404, 'Version not found');
    }

    const data = impacts.map((i) => ({
      toolVersionId: versionId,
      moduleId: i.moduleId,
      lessonId: i.lessonId ?? null,
      impactDescription: i.impactDescription ?? null,
      priority: i.priority,
    }));

    const created = await prisma.contentUpdateImpact.createMany({ data });

    // Mark version as processed
    await prisma.toolVersion.update({
      where: { id: versionId },
      data: { isProcessed: true },
    });

    return { count: created.count };
  }

  // ── Admin: Update Impact Status ────────────────────────

  async updateImpactStatus(impactId: string, userId: string, data: { status: string; notes?: string }) {
    const impact = await prisma.contentUpdateImpact.findUnique({ where: { id: impactId } });
    if (!impact) {
      throw new AppError(404, 'Impact not found');
    }

    return prisma.contentUpdateImpact.update({
      where: { id: impactId },
      data: {
        status: data.status,
        notes: data.notes,
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });
  }

  // ── Admin: Update Tool Content Version ─────────────────

  async updateToolContentVersion(toolSlug: string, currentContentVersion: string) {
    const config = await prisma.toolTrackingConfig.findUnique({ where: { toolSlug } });
    if (!config) {
      throw new AppError(404, 'Tool not found');
    }

    return prisma.toolTrackingConfig.update({
      where: { toolSlug },
      data: { currentContentVersion },
    });
  }

  // ── Admin: Check All Tool Versions ─────────────────────

  async checkAllToolVersions(): Promise<VersionCheckResult[]> {
    const configs = await prisma.toolTrackingConfig.findMany();
    const results: VersionCheckResult[] = [];

    for (const config of configs) {
      try {
        let latestVersion: string | null = null;

        switch (config.checkSourceType) {
          case 'npm':
            latestVersion = await this.checkNpmVersion(config.checkSourceIdentifier);
            break;
          case 'github_release':
            latestVersion = await this.checkGitHubRelease(config.checkSourceIdentifier);
            break;
          default:
            continue;
        }

        if (!latestVersion) continue;

        const existingVersion = await prisma.toolVersion.findUnique({
          where: { toolSlug_version: { toolSlug: config.toolSlug, version: latestVersion } },
        });

        results.push({
          toolSlug: config.toolSlug,
          latestVersion,
          isNew: !existingVersion,
        });

        await prisma.toolTrackingConfig.update({
          where: { toolSlug: config.toolSlug },
          data: { lastCheckedAt: new Date() },
        });
      } catch {
        results.push({
          toolSlug: config.toolSlug,
          latestVersion: 'check_failed',
          isNew: false,
        });
      }
    }

    return results;
  }

  // ── Private Helpers ────────────────────────────────────

  private async countUnresolvedImpacts(toolSlug: string) {
    const [pending, inProgress] = await Promise.all([
      prisma.contentUpdateImpact.count({
        where: { toolVersion: { toolSlug }, status: 'pending' },
      }),
      prisma.contentUpdateImpact.count({
        where: { toolVersion: { toolSlug }, status: 'in_progress' },
      }),
    ]);
    return { pending, inProgress };
  }

  private async countToolLessons() {
    return prisma.lesson.count({ where: { isPublished: true } });
  }

  private calculateFreshness(totalLessons: number, affectedNotResolved: number): number {
    if (totalLessons === 0) return 100;
    const freshness = Math.round(((totalLessons - affectedNotResolved) / totalLessons) * 100);
    return Math.max(0, Math.min(100, freshness));
  }

  private calculateOverallFreshness(toolScores: { freshness: number; lessonCount: number }[]): number {
    const totalLessons = toolScores.reduce((sum: number, t) => sum + t.lessonCount, 0);
    if (totalLessons === 0) return 100;
    const weightedSum = toolScores.reduce((sum: number, t) => sum + t.freshness * t.lessonCount, 0);
    return Math.round(weightedSum / totalLessons);
  }

  private async checkNpmVersion(packageName: string): Promise<string | null> {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!res.ok) return null;
    const data = (await res.json()) as { version: string };
    return data.version;
  }

  private async checkGitHubRelease(repo: string): Promise<string | null> {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name: string };
    return data.tag_name.replace(/^v/, '');
  }
}
