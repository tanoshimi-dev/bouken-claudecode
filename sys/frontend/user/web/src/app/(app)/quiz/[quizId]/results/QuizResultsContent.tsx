'use client';

import { use } from 'react';

export function QuizResultsContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(paramsPromise);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">クイズ結果</h1>
      <p className="text-muted-foreground">Quiz ID: {quizId}</p>

      {/* Score and results will be rendered here */}
    </div>
  );
}
