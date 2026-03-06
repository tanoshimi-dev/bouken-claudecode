'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { FreshnessSummary, RecentUpdate } from '@learn-ai/shared-types';

function freshnessColor(freshness: number): string {
  if (freshness >= 90) return 'bg-green-500';
  if (freshness >= 70) return 'bg-yellow-500';
  if (freshness >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function freshnessTextColor(freshness: number): string {
  if (freshness >= 90) return 'text-green-600';
  if (freshness >= 70) return 'text-yellow-600';
  if (freshness >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function StatusBadge({ status }: { status: string }) {
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

export function UpdatesOverviewContent() {
  const { data: summary, loading: summaryLoading } = useApi<FreshnessSummary>(() =>
    apiClient.getUpdatesSummary(),
  );
  const { data: recentUpdates, loading: recentLoading } = useApi<RecentUpdate[]>(() =>
    apiClient.getRecentUpdates(10),
  );

  const loading = summaryLoading || recentLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Update Tracker</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-xl border p-6">
              <div className="bg-muted mb-2 h-5 w-32 rounded" />
              <div className="bg-muted h-8 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Update Tracker</h1>

      {/* Overall Freshness */}
      {summary && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Overall Content Freshness</h2>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="bg-muted h-4 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${freshnessColor(summary.overallFreshness)}`}
                  style={{ width: `${summary.overallFreshness}%` }}
                />
              </div>
            </div>
            <span className={`text-2xl font-bold ${freshnessTextColor(summary.overallFreshness)}`}>
              {summary.overallFreshness}%
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {summary.tools.length} tools tracked
            {summary.lastChecked && ` | Last checked: ${new Date(summary.lastChecked).toLocaleDateString('ja-JP')}`}
          </p>
        </div>
      )}

      {/* Tool Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.tools.map((tool) => (
            <Link
              key={tool.toolSlug}
              href={`/updates/${tool.toolSlug}`}
              className="bg-card hover:bg-accent/50 rounded-xl border p-5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{tool.displayName}</h3>
                <span className={`text-lg font-bold ${freshnessTextColor(tool.freshness)}`}>
                  {tool.freshness}%
                </span>
              </div>
              <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${freshnessColor(tool.freshness)}`}
                  style={{ width: `${tool.freshness}%` }}
                />
              </div>
              <div className="text-muted-foreground mt-3 space-y-1 text-sm">
                <p>
                  Latest: <span className="text-foreground font-medium">{tool.latestVersion}</span>
                </p>
                <p>
                  Content: <span className="text-foreground font-medium">{tool.contentVersion}</span>
                </p>
                <p>
                  {tool.pendingUpdates > 0 ? (
                    <span className="text-yellow-600">{tool.pendingUpdates} updates pending</span>
                  ) : (
                    <span className="text-green-600">Up to date</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Updates */}
      {recentUpdates && recentUpdates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Updates</h2>
          <div className="bg-card divide-y rounded-xl border">
            {recentUpdates.map((update) => (
              <Link
                key={update.id}
                href={`/updates/${update.toolSlug}`}
                className="hover:bg-accent/30 flex items-start gap-4 p-4 transition-colors"
              >
                <div className="text-muted-foreground mt-0.5 whitespace-nowrap text-sm">
                  {new Date(update.releaseDate).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {update.displayName}{' '}
                    <span className="text-muted-foreground">v{update.version}</span>
                    {update.breakingChanges && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        Breaking
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">{update.summary}</p>
                </div>
                <div className="text-sm">
                  {update.impactCount > 0 ? (
                    <StatusBadge
                      status={update.resolvedCount === update.impactCount ? 'updated' : 'pending'}
                    />
                  ) : (
                    <StatusBadge status="not_affected" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
