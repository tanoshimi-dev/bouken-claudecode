'use client';

import type { AchievementProgress } from '@learn-claude-code/shared-types';

export function BadgeCard({ achievement }: { achievement: AchievementProgress }) {
  const { badge, earned, earnedAt, progress } = achievement;

  return (
    <div
      className={`rounded-xl border p-4 text-center transition-all ${
        earned ? 'bg-card' : 'bg-card/50 opacity-50 grayscale'
      }`}
    >
      <div className="text-4xl">{badge.icon}</div>
      <p className="mt-2 text-sm font-semibold">{badge.name}</p>
      <p className="text-muted-foreground mt-1 text-xs">{badge.description}</p>
      {earned && earnedAt && (
        <p className="text-muted-foreground mt-2 text-xs">
          {new Date(earnedAt).toLocaleDateString('ja-JP')}
        </p>
      )}
      {!earned && progress && progress.target > 0 && (
        <div className="mt-2">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${(progress.current / progress.target) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {progress.current} / {progress.target}
          </p>
        </div>
      )}
    </div>
  );
}
