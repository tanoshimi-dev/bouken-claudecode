'use client';

import { use } from 'react';

export function QuizContent({ paramsPromise }: { paramsPromise: Promise<{ quizId: string }> }) {
  const { quizId } = use(paramsPromise);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">クイズ</h1>
      <p className="text-muted-foreground">Quiz ID: {quizId}</p>

      {/* Quiz questions will be rendered here */}
    </div>
  );
}
