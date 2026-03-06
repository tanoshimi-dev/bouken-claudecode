'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import { useContentType } from '@/components/content/ContentTypeProvider';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';
import type { LessonDetail, NewAchievement } from '@learn-ai/shared-types';
import { showAchievementToasts } from '@/components/achievements/AchievementToast';

export function LessonContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ contentType: string; moduleId: string; lessonId: string }>;
}) {
  const { moduleId, lessonId } = use(paramsPromise);
  const contentType = useContentType();
  const { data: lesson, loading, error } = useApi<LessonDetail>(() =>
    apiClient.getLesson(moduleId, lessonId),
  );
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await apiClient.completeLesson(lessonId);
      setCompleted(true);
      showAchievementToasts(
        (res.data as { newAchievements?: NewAchievement[] }).newAchievements,
      );
    } catch {
      // ignore
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="bg-muted h-8 w-64 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <p className="text-destructive">エラーが発生しました: {error ?? 'レッスンが見つかりません'}</p>
        <Link href={`/contents/${contentType}/modules/${moduleId}`} className="text-primary hover:underline">
          モジュールに戻る
        </Link>
      </div>
    );
  }

  const isCompleted = completed || lesson.status === 'completed';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href={`/contents/${contentType}/modules`} className="hover:text-foreground transition-colors">
          モジュール
        </Link>
        <span>/</span>
        <Link href={`/contents/${contentType}/modules/${moduleId}`} className="hover:text-foreground transition-colors">
          Module {lesson.module.number}
        </Link>
        <span>/</span>
        <span className="text-foreground">Lesson {lesson.order}</span>
      </div>

      {/* Title + Version Tag */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {lesson.updateStatus ? (
            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
              Update pending: v{lesson.updateStatus.version}
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Up to date
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm capitalize">{lesson.lessonType}</p>
      </div>

      {/* Markdown Content */}
      <MarkdownRenderer content={lesson.contentMd} />

      {/* Complete Button */}
      <div className="border-t pt-6">
        {isCompleted ? (
          <p className="text-sm font-medium text-green-500">このレッスンは完了済みです ✓</p>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg px-6 py-2.5 font-medium transition-colors"
          >
            {completing ? '処理中...' : 'レッスンを完了する'}
          </button>
        )}
      </div>

      {/* Prev/Next Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        {lesson.prevLesson ? (
          <Link
            href={`/contents/${contentType}/modules/${moduleId}/lessons/${lesson.prevLesson.id}`}
            className="text-primary hover:underline text-sm"
          >
            ← {lesson.prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
        {lesson.nextLesson ? (
          <Link
            href={`/contents/${contentType}/modules/${moduleId}/lessons/${lesson.nextLesson.id}`}
            className="text-primary hover:underline text-sm"
          >
            {lesson.nextLesson.title} →
          </Link>
        ) : (
          <Link
            href={`/contents/${contentType}/modules/${moduleId}`}
            className="text-primary hover:underline text-sm"
          >
            モジュールに戻る →
          </Link>
        )}
      </div>
    </div>
  );
}
