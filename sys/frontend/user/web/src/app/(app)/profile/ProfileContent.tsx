'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { OverallProgress, StreakInfo } from '@learn-claude-code/shared-types';

export function ProfileContent() {
  const { user, logout } = useAuth();
  const { data: progress, loading: progressLoading } = useApi<OverallProgress>(() =>
    apiClient.getProgress(),
  );
  const { data: streaks, loading: streaksLoading } = useApi<StreakInfo>(() =>
    apiClient.getStreaks(),
  );

  const loading = progressLoading || streaksLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">プロフィール</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User info */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">ユーザー情報</h2>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium">{user.name}</p>
                  {user.email && (
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-muted-foreground text-sm">
                  登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                </p>
                {user.providers.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    連携サービス: {user.providers.join(', ')}
                  </p>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <Link
                  href="/profile/settings"
                  className="bg-accent hover:bg-accent/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  設定
                </Link>
                <button
                  onClick={logout}
                  className="hover:bg-destructive/10 text-destructive rounded-lg border border-current px-4 py-2 text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-muted h-32 animate-pulse rounded-lg" />
          )}
        </div>

        {/* Learning stats */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">学習統計</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-8 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">全体進捗</span>
                <span className="font-bold">{progress?.overallPercent ?? 0}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress?.overallPercent ?? 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress?.completedLessons ?? 0}</p>
                  <p className="text-muted-foreground text-xs">完了レッスン</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress?.totalLessons ?? 0}</p>
                  <p className="text-muted-foreground text-xs">総レッスン数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{streaks?.currentStreak ?? 0}</p>
                  <p className="text-muted-foreground text-xs">連続学習日数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{streaks?.longestStreak ?? 0}</p>
                  <p className="text-muted-foreground text-xs">最長ストリーク</p>
                </div>
              </div>

              {/* Module-wise stats */}
              {progress && progress.modules.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="mb-3 text-sm font-medium">モジュール別</h3>
                  <div className="space-y-2">
                    {progress.modules.map((mod) => (
                      <div key={mod.moduleId} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">
                          {mod.moduleTitle}
                        </span>
                        <span className="ml-2 font-medium">{mod.progressPercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
