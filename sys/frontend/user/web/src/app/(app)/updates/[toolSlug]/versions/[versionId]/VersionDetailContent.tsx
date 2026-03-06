'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { ToolVersionDetail, ImpactStatus, ImpactPriority } from '@learn-ai/shared-types';

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

export function VersionDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ toolSlug: string; versionId: string }>;
}) {
  const { toolSlug, versionId } = use(paramsPromise);
  const { data, loading, error } = useApi<ToolVersionDetail>(() =>
    apiClient.getVersionDetail(toolSlug, versionId),
  );

  if (loading) {
    return (
      <div className="bg-card animate-pulse rounded-xl border p-6">
        <div className="bg-muted mb-3 h-6 w-48 rounded" />
        <div className="bg-muted h-4 w-full rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href={`/updates/${toolSlug}`} className="text-muted-foreground hover:text-foreground text-sm">
          &larr; Back
        </Link>
        <p className="text-red-500">{error ?? 'Version not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/updates/${toolSlug}`} className="text-muted-foreground hover:text-foreground text-sm">
        &larr; Back
      </Link>

      <h1 className="text-3xl font-bold">v{data.version}</h1>

      {/* Release Info */}
      <div className="bg-card rounded-xl border p-6">
        <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-3">
          <div>
            Released: <span className="text-foreground font-medium">{new Date(data.releaseDate).toLocaleDateString('ja-JP')}</span>
          </div>
          <div>
            Breaking Changes:{' '}
            <span className={data.breakingChanges ? 'font-medium text-red-600' : 'text-foreground font-medium'}>
              {data.breakingChanges ? 'Yes' : 'No'}
            </span>
          </div>
          {data.changelogUrl && (
            <div>
              <a href={data.changelogUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Official Changelog
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
        <p className="text-muted-foreground">{data.summary}</p>
      </div>

      {/* Changes */}
      {data.changes.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Changes</h2>
          <div className="space-y-1">
            {data.changes.map((change, i) => {
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
                <p key={i} className="text-sm">
                  <span className={`font-mono text-xs ${typeColors[change.type] ?? ''}`}>
                    {typeLabels[change.type] ?? `[${change.type.toUpperCase()}]`}
                  </span>{' '}
                  {change.description}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Affected Lessons */}
      {data.impacts.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Affected Lessons</h2>
          <div className="bg-card divide-y rounded-xl border">
            {data.impacts.map((impact) => (
              <div key={impact.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{impact.moduleTitle}</p>
                    {impact.lessonTitle && (
                      <p className="text-muted-foreground text-sm">{impact.lessonTitle}</p>
                    )}
                    {impact.impactDescription && (
                      <p className="text-muted-foreground mt-1 text-sm">{impact.impactDescription}</p>
                    )}
                  </div>
                  <StatusBadge status={impact.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
