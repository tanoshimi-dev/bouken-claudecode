'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { ToolDetail, ImpactStatus, ImpactPriority } from '@learn-ai/shared-types';

function freshnessColor(freshness: number): string {
  if (freshness >= 90) return 'bg-green-500';
  if (freshness >= 70) return 'bg-yellow-500';
  if (freshness >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function StatusBadge({ status }: { status: ImpactStatus }) {
  const styles: Record<string, string> = {
    updated: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    not_affected: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    updated: 'Updated',
    in_progress: 'In Progress',
    pending: 'Pending',
    not_affected: 'N/A',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: ImpactPriority }) {
  const indicators: Record<string, string> = {
    critical: '[!!!]',
    high: '[!!]',
    normal: '[!]',
    low: '[.]',
  };
  const colors: Record<string, string> = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    normal: 'text-yellow-600',
    low: 'text-gray-400',
  };
  return (
    <span className={`font-mono text-xs ${colors[priority] ?? ''}`}>
      {indicators[priority] ?? ''}
    </span>
  );
}

export function ToolDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ toolSlug: string }>;
}) {
  const { toolSlug } = use(paramsPromise);
  const { data, loading, error } = useApi<ToolDetail>(() => apiClient.getToolDetail(toolSlug));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card animate-pulse rounded-xl border p-6">
          <div className="bg-muted mb-3 h-6 w-48 rounded" />
          <div className="bg-muted h-4 w-full rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/updates" className="text-muted-foreground hover:text-foreground text-sm">
          &larr; Back
        </Link>
        <p className="text-red-500">{error ?? 'Tool not found'}</p>
      </div>
    );
  }

  const { tool, versions } = data;
  const pendingCount = versions.reduce(
    (sum, v) => sum + v.impacts.filter((i) => i.status === 'pending' || i.status === 'in_progress').length,
    0,
  );
  const totalImpacts = versions.reduce((sum, v) => sum + v.impacts.length, 0);
  const freshness = totalImpacts > 0
    ? Math.round(((totalImpacts - pendingCount) / totalImpacts) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <Link href="/updates" className="text-muted-foreground hover:text-foreground text-sm">
        &larr; Back
      </Link>

      <h1 className="text-3xl font-bold">{tool.displayName} Updates</h1>

      {/* Current Status */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Status</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Official:</span>{' '}
            <span className="font-medium">
              {versions[0]?.version ?? 'N/A'}{' '}
              {versions[0] && (
                <span className="text-muted-foreground">
                  ({new Date(versions[0].releaseDate).toLocaleDateString('ja-JP')})
                </span>
              )}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Content:</span>{' '}
            <span className="font-medium">{tool.currentContentVersion}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${freshnessColor(freshness)}`}
                  style={{ width: `${freshness}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-bold">{freshness}%</span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {pendingCount > 0 ? `${pendingCount} pending updates` : 'Up to date'}
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          {tool.changelogUrl && (
            <a
              href={tool.changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              View Official Changelog
            </a>
          )}
          {tool.documentationUrl && (
            <a
              href={tool.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              Documentation
            </a>
          )}
        </div>
      </div>

      {/* Version Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Version Timeline</h2>
        <div className="relative space-y-0">
          {versions.map((v, index) => {
            const hasUnresolved = v.impacts.some(
              (i) => i.status === 'pending' || i.status === 'in_progress',
            );
            return (
              <div key={v.id} className="relative flex gap-4 pb-6">
                {/* Timeline line */}
                {index < versions.length - 1 && (
                  <div className="bg-border absolute left-[11px] top-6 h-full w-0.5" />
                )}
                {/* Timeline dot */}
                <div
                  className={`relative z-10 mt-1.5 h-6 w-6 flex-shrink-0 rounded-full border-2 ${
                    hasUnresolved
                      ? 'border-yellow-500 bg-yellow-100'
                      : 'border-green-500 bg-green-100'
                  }`}
                />
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">v{v.version}</span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(v.releaseDate).toLocaleDateString('ja-JP')}
                    </span>
                    {v.breakingChanges && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        Breaking
                      </span>
                    )}
                    {hasUnresolved && <PriorityIndicator priority="high" />}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{v.summary}</p>

                  {/* Changes */}
                  {v.changes.length > 0 && (
                    <div className="mt-2 space-y-0.5 text-sm">
                      {v.changes.map((change, ci) => {
                        const typeLabels: Record<string, string> = {
                          new: '[NEW]',
                          changed: '[CHANGED]',
                          fixed: '[FIXED]',
                          deprecated: '[DEPRECATED]',
                          removed: '[REMOVED]',
                        };
                        const typeColors: Record<string, string> = {
                          new: 'text-green-600',
                          changed: 'text-blue-600',
                          fixed: 'text-purple-600',
                          deprecated: 'text-orange-600',
                          removed: 'text-red-600',
                        };
                        return (
                          <p key={ci}>
                            <span className={`font-mono text-xs ${typeColors[change.type] ?? ''}`}>
                              {typeLabels[change.type] ?? `[${change.type.toUpperCase()}]`}
                            </span>{' '}
                            {change.description}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {/* Affected Lessons */}
                  {v.impacts.length > 0 && (
                    <div className="bg-muted/50 mt-3 rounded-lg border p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider">
                        Affected Lessons
                      </p>
                      <div className="space-y-1.5">
                        {v.impacts.map((impact) => (
                          <div key={impact.id} className="flex items-center justify-between text-sm">
                            <div className="min-w-0 flex-1">
                              <span className="text-muted-foreground">{impact.moduleTitle}</span>
                              {impact.lessonTitle && (
                                <span> / {impact.lessonTitle}</span>
                              )}
                            </div>
                            <div className="ml-2 flex items-center gap-2">
                              <PriorityIndicator priority={impact.priority} />
                              <StatusBadge status={impact.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
