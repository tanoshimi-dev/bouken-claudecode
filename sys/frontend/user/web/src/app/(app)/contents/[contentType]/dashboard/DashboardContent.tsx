'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { useContentType } from '@/components/content/ContentTypeProvider';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { OverallProgress, StreakInfo } from '@learn-ai/shared-types';

export function DashboardContent() {
  const { user } = useAuth();
  const contentType = useContentType();
  const ct = CONTENT_TYPES[contentType];
  const { data: progress, loading: progressLoading } = useApi<OverallProgress>(() =>
    apiClient.getProgress(contentType),
  );
  const { data: streaks, loading: streaksLoading } = useApi<StreakInfo>(() =>
    apiClient.getStreaks(),
  );

  const loading = progressLoading || streaksLoading;

  const currentModule = progress?.modules.find(
    (m) => m.progressPercent > 0 && m.progressPercent < 100,
  ) ?? progress?.modules.find((m) => m.progressPercent === 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contents"
          className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm transition-colors"
        >
          ← ツール選択
        </Link>
        <h1 className="text-3xl font-bold">
          {ct.icon} {ct.nameJa} ダッシュボード
        </h1>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-xl border p-6">
              <div className="bg-muted mb-2 h-5 w-24 rounded" />
              <div className="bg-muted h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Progress Overview */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold">学習進捗</h2>
            <div className="mt-3">
              <p className="text-3xl font-bold">{progress?.overallPercent ?? 0}%</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {progress?.completedLessons ?? 0} / {progress?.totalLessons ?? 0} レッスン完了
              </p>
              <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress?.overallPercent ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Module */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold">現在のモジュール</h2>
            {currentModule ? (
              <div className="mt-3">
                <p className="font-medium">{currentModule.moduleTitle}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentModule.completedLessons} / {currentModule.totalLessons} レッスン完了
                </p>
                <Link
                  href={`/contents/${contentType}/modules/${currentModule.moduleId}`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  続きから学習
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm">
                  {progress?.overallPercent === 100
                    ? 'すべてのモジュールを完了しました！'
                    : 'モジュールを選択して学習を始めましょう'}
                </p>
                <Link
                  href={`/contents/${contentType}/modules`}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  モジュール一覧へ
                </Link>
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold">ストリーク</h2>
            <div className="mt-3">
              <p className="text-3xl font-bold">{streaks?.currentStreak ?? 0}日</p>
              <p className="text-muted-foreground mt-1 text-sm">連続学習日数</p>
              <p className="text-muted-foreground mt-2 text-sm">
                最長記録: {streaks?.longestStreak ?? 0}日
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Module Progress List */}
      {!loading && progress && progress.modules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">モジュール別進捗</h2>
          <div className="space-y-3">
            {progress.modules.map((mod) => (
              <Link
                key={mod.moduleId}
                href={`/contents/${contentType}/modules/${mod.moduleId}`}
                className="bg-card hover:bg-accent/50 flex items-center justify-between rounded-xl border p-4 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    Module {mod.moduleNumber}: {mod.moduleTitle}
                  </p>
                  <div className="bg-muted mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${mod.progressPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-muted-foreground ml-4 text-sm">{mod.progressPercent}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
