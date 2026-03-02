'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import type { QuizQuestion } from '@learn-claude-code/shared-types';

interface StoredQuizResult {
  score: number;
  maxScore: number;
  percentage: number;
  quizTitle: string;
  questions: QuizQuestion[];
  results: {
    questionId: string;
    correct: boolean;
    correctAnswer: unknown;
    explanation: string;
  }[];
}

export function QuizResultsContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(paramsPromise);
  const [result, setResult] = useState<StoredQuizResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz-result-${quizId}`);
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, [quizId]);

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-muted-foreground">クイズ結果が見つかりません</p>
        <Link href="/modules" className="text-primary hover:underline">
          モジュール一覧に戻る
        </Link>
      </div>
    );
  }

  const scoreColor =
    result.percentage >= 80
      ? 'text-green-500'
      : result.percentage >= 60
        ? 'text-yellow-500'
        : 'text-red-500';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">クイズ結果</h1>
        <p className="text-muted-foreground mt-1">{result.quizTitle}</p>
      </div>

      {/* Score Card */}
      <div className="bg-card rounded-xl border p-8 text-center">
        <p className={`text-6xl font-bold ${scoreColor}`}>{result.percentage}%</p>
        <p className="text-muted-foreground mt-2 text-lg">
          {result.score} / {result.maxScore} 点
        </p>
        <p className="mt-4 text-sm">
          {result.percentage >= 80
            ? '素晴らしい！よくできました！'
            : result.percentage >= 60
              ? 'まずまずの結果です。復習してみましょう。'
              : 'もう一度レッスンを見直してみましょう。'}
        </p>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">問題別結果</h2>
        {result.results.map((r, index) => {
          const question = result.questions.find((q) => q.id === r.questionId);
          return (
            <div
              key={r.questionId}
              className={`rounded-xl border p-4 ${
                r.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                    r.correct ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {r.correct ? '○' : '✕'}
                </span>
                <span className="text-sm font-medium">問題 {index + 1}</span>
              </div>

              {question && (
                <p className="mb-2 text-sm">{question.questionText}</p>
              )}

              <div className="text-muted-foreground text-sm">
                <span className="font-medium">正解:</span>{' '}
                {Array.isArray(r.correctAnswer) ? (
                  <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                    {(r.correctAnswer as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                ) : (
                  <span>{String(r.correctAnswer)}</span>
                )}
              </div>

              <div className="bg-muted/50 mt-2 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium">解説:</span> {r.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-4 border-t pt-6">
        <Link
          href={`/quiz/${quizId}`}
          className="border-border hover:bg-accent flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-medium transition-colors"
        >
          もう一度挑戦する
        </Link>
        <Link
          href="/modules"
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors"
        >
          モジュール一覧へ
        </Link>
      </div>
    </div>
  );
}
