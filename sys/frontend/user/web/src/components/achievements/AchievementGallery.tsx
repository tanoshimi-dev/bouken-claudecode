'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import { BadgeCard } from './BadgeCard';
import type { AchievementProgress } from '@learn-claude-code/shared-types';

const CATEGORIES = [
  { key: 'all', label: 'すべて' },
  { key: 'lesson', label: 'レッスン' },
  { key: 'quiz', label: 'クイズ' },
  { key: 'streak', label: 'ストリーク' },
  { key: 'special', label: 'スペシャル' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function AchievementGallery() {
  const { data: achievements, loading } = useApi<AchievementProgress[]>(() =>
    apiClient.getAchievementProgress(),
  );
  const [category, setCategory] = useState<CategoryKey>('all');

  const filtered =
    category === 'all'
      ? achievements
      : achievements?.filter((a) => a.badge.category === category);

  const earnedCount = achievements?.filter((a) => a.earned).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-32 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">バッジ</h2>
        <span className="text-muted-foreground text-sm">
          {earnedCount} / {totalCount} バッジ獲得
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              category === cat.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered?.map((achievement) => (
          <BadgeCard key={achievement.badge.slug} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
