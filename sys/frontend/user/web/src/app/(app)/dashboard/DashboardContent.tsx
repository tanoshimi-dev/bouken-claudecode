'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { ContentTypeSlug, OverallProgress, StreakInfo, UserAchievement } from '@learn-ai/shared-types';

export function DashboardContent() {
  const { user } = useAuth();
  const { data: progress, loading: progressLoading } = useApi<OverallProgress>(() =>
    apiClient.getProgress(),
  );
  const { data: streaks, loading: streaksLoading } = useApi<StreakInfo>(() =>
    apiClient.getStreaks(),
  );
  const { data: achievements } = useApi<UserAchievement[]>(() =>
    apiClient.getAchievements(),
  );

  const loading = progressLoading || streaksLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {user ? `おかえりなさい、${user.name}さん` : 'ダッシュボード'}
      </h1>

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
          {/* Overall Progress */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold">全体進捗</h2>
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

          {/* Quick Link */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold">学習を始める</h2>
            <div className="mt-3">
              <p className="text-muted-foreground text-sm">
                AIコーディングツールを選んで学習を始めましょう
              </p>
              <Link
                href="/contents"
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                ツールを選ぶ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Per-content-type progress */}
      {!loading && progress && progress.byContentType && progress.byContentType.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">ツール別進捗</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {progress.byContentType.map((ctp) => {
              const ct = CONTENT_TYPES[ctp.contentType as ContentTypeSlug];
              if (!ct) return null;
              return (
                <Link
                  key={ctp.contentType}
                  href={`/contents/${ctp.contentType}/dashboard`}
                  className="bg-card hover:bg-accent/50 rounded-xl border p-5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ct.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{ct.nameJa}</p>
                      <p className="text-muted-foreground text-sm">
                        {ctp.completedLessons} / {ctp.totalLessons} レッスン完了
                      </p>
                    </div>
                    <span className="text-lg font-bold">{ctp.overallPercent}%</span>
                  </div>
                  <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${ctp.overallPercent}%`, backgroundColor: ct.color }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Badges */}
      {achievements && achievements.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">最近獲得したバッジ</h2>
            <Link href="/profile" className="text-primary text-sm hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {achievements.slice(0, 3).map((a) => (
              <div key={a.badge.slug} className="bg-card rounded-xl border p-4 text-center">
                <div className="text-3xl">{a.badge.icon}</div>
                <p className="mt-2 text-sm font-semibold">{a.badge.name}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(a.earnedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
