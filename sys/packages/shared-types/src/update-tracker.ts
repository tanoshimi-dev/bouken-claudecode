export type ToolSlug = 'claude-code' | 'codex' | 'github-copilot' | 'gemini';

export type ChangeType = 'new' | 'changed' | 'fixed' | 'deprecated' | 'removed';

export type ImpactStatus = 'not_affected' | 'pending' | 'in_progress' | 'updated';

export type ImpactPriority = 'critical' | 'high' | 'normal' | 'low';

export interface ToolFreshness {
  toolSlug: ToolSlug;
  displayName: string;
  freshness: number;
  latestVersion: string;
  contentVersion: string;
  pendingUpdates: number;
}

export interface FreshnessSummary {
  overallFreshness: number;
  lastChecked: string | null;
  tools: ToolFreshness[];
}

export interface ToolVersionChange {
  type: ChangeType;
  description: string;
}

export interface VersionImpact {
  id: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string | null;
  lessonTitle: string | null;
  status: ImpactStatus;
  priority: ImpactPriority;
  impactDescription: string | null;
}

export interface ToolVersionDetail {
  id: string;
  version: string;
  releaseDate: string;
  summary: string;
  changes: ToolVersionChange[];
  breakingChanges: boolean;
  changelogUrl: string | null;
  impacts: VersionImpact[];
}

export interface ToolDetail {
  tool: {
    toolSlug: ToolSlug;
    displayName: string;
    currentContentVersion: string;
    changelogUrl: string;
    documentationUrl: string;
    lastCheckedAt: string | null;
  };
  versions: ToolVersionDetail[];
}

export interface RecentUpdate {
  id: string;
  toolSlug: ToolSlug;
  displayName: string;
  version: string;
  releaseDate: string;
  summary: string;
  breakingChanges: boolean;
  impactCount: number;
  resolvedCount: number;
}

export interface VersionCheckResult {
  toolSlug: string;
  latestVersion: string;
  isNew: boolean;
}
