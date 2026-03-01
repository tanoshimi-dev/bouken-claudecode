'use client';

import { use } from 'react';

export function LessonContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ moduleId: string; lessonId: string }>;
}) {
  const { moduleId, lessonId } = use(paramsPromise);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">レッスン</h1>
      <p className="text-muted-foreground">
        Module: {moduleId} / Lesson: {lessonId}
      </p>

      {/* Markdown content will be rendered here */}

      {/* Navigation (prev/next) will be rendered here */}
    </div>
  );
}
