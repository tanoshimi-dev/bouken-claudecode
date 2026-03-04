'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { ContentTypeWithCount } from '@learn-ai/shared-types';

export function ContentsContent() {
  const { data: contentTypes, loading, error } = useApi<ContentTypeWithCount[]>(() =>
    apiClient.getContentTypes(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AIツールを選択</h1>
        <p className="text-muted-foreground mt-1">学習したいAIコーディングツールを選んでください</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-xl border p-6">
              <div className="bg-muted mb-3 h-10 w-10 rounded-lg" />
              <div className="bg-muted mb-2 h-6 w-40 rounded" />
              <div className="bg-muted h-4 w-full rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">エラーが発生しました: {error}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {contentTypes?.map((ct) => {
            if (!ct.hasContent) {
              return (
                <div
                  key={ct.slug}
                  className="bg-card rounded-xl border p-6 opacity-50"
                >
                  <div className="mb-3 text-4xl">{ct.icon}</div>
                  <h2 className="text-lg font-semibold">{ct.nameJa}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{ct.description}</p>
                  <p className="mt-3 text-sm font-medium text-amber-500">準備中</p>
                </div>
              );
            }

            return (
              <Link
                key={ct.slug}
                href={`/contents/${ct.slug}/modules`}
                className="bg-card hover:bg-accent/50 group rounded-xl border p-6 transition-colors"
              >
                <div className="mb-3 text-4xl">{ct.icon}</div>
                <h2 className="text-lg font-semibold group-hover:underline">{ct.nameJa}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{ct.description}</p>
                <p className="text-muted-foreground mt-3 text-sm">
                  {ct.moduleCount} モジュール
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
