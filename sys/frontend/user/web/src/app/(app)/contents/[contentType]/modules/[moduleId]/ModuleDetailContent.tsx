'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import { useContentType } from '@/components/content/ContentTypeProvider';
import type { ModuleDetail } from '@learn-ai/shared-types';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
          ✓
        </span>
      );
    case 'in_progress':
      return (
        <span className="border-primary flex h-6 w-6 items-center justify-center rounded-full border-2">
          <span className="bg-primary h-2 w-2 rounded-full" />
        </span>
      );
    default:
      return (
        <span className="border-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2 opacity-40" />
      );
  }
}

export function ModuleDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ contentType: string; moduleId: string }>;
}) {
  const { moduleId } = use(paramsPromise);
  const contentType = useContentType();
  const { data: mod, loading, error } = useApi<ModuleDetail>(() =>
    apiClient.getModule(moduleId),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card animate-pulse rounded-xl border p-4">
              <div className="bg-muted h-5 w-48 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">エラーが発生しました: {error ?? 'モジュールが見つかりません'}</p>
        <Link href={`/contents/${contentType}/modules`} className="text-primary hover:underline">
          モジュール一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/contents/${contentType}/modules`} className="text-muted-foreground hover:text-foreground mb-2 inline-block text-sm transition-colors">
          ← モジュール一覧
        </Link>
        <h1 className="text-3xl font-bold">
          Module {mod.number}: {mod.title}
        </h1>
        <p className="text-muted-foreground mt-2">{mod.description}</p>
        <p className="text-muted-foreground mt-1 text-sm">推定学習時間: 約{mod.estimatedMinutes}分</p>
      </div>

      {/* Lessons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">レッスン</h2>
        <div className="space-y-2">
          {mod.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/contents/${contentType}/modules/${moduleId}/lessons/${lesson.id}`}
              className="bg-card hover:bg-accent/50 flex items-center gap-4 rounded-xl border p-4 transition-colors"
            >
              <StatusIcon status={lesson.status} />
              <div className="flex-1">
                <p className="font-medium">
                  Lesson {lesson.order}: {lesson.title}
                </p>
                <p className="text-muted-foreground text-xs capitalize">{lesson.lessonType}</p>
              </div>
              <span className="text-muted-foreground text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quizzes */}
      {mod.quizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">クイズ</h2>
          <div className="space-y-2">
            {mod.quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.id}`}
                className="bg-card hover:bg-accent/50 flex items-center gap-4 rounded-xl border p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                  Q
                </span>
                <div className="flex-1">
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-muted-foreground text-xs">
                    難易度: {quiz.difficulty} / {quiz.points}ポイント
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
