'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import { useContentType } from '@/components/content/ContentTypeProvider';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import type { ModuleWithProgress } from '@learn-ai/shared-types';

export function ModulesContent() {
  const contentType = useContentType();
  const ct = CONTENT_TYPES[contentType];
  const { data: modules, loading, error } = useApi<ModuleWithProgress[]>(() =>
    apiClient.getModules(contentType),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contents"
          className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm transition-colors"
        >
          ← ツール選択
        </Link>
        <h1 className="text-3xl font-bold">{ct.nameJa} モジュール</h1>
        <p className="text-muted-foreground mt-1">学習するモジュールを選択してください</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-xl border p-6">
              <div className="bg-muted mb-3 h-6 w-48 rounded" />
              <div className="bg-muted mb-2 h-4 w-full rounded" />
              <div className="bg-muted h-4 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">エラーが発生しました: {error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules?.map((mod) => (
            <Link
              key={mod.id}
              href={`/contents/${contentType}/modules/${mod.id}`}
              className="bg-card hover:bg-accent/50 group rounded-xl border p-6 transition-colors"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Module {mod.number}
                </span>
                <span className="text-muted-foreground text-xs">
                  約{mod.estimatedMinutes}分
                </span>
              </div>
              <h2 className="mb-2 text-lg font-semibold group-hover:underline">{mod.title}</h2>
              <p className="text-muted-foreground mb-4 text-sm">{mod.description}</p>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {mod.completedLessons} / {mod.totalLessons} レッスン
                  </span>
                  <span className="font-medium">{mod.progressPercent}%</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${mod.progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
