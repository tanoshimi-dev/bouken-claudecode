'use client';

import { use, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/lib/api';
import type { QuizDetail, QuizQuestion, NewAchievement } from '@learn-claude-code/shared-types';
import { showAchievementToasts } from '@/components/achievements/AchievementToast';

function MultipleChoiceCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: unknown;
  onSelect: (answer: unknown) => void;
}) {
  const options = question.options as string[];

  return (
    <div className="bg-card rounded-xl border p-6">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        問題 {index + 1}
        <span className="ml-2">({question.questionType === 'true_false' ? '正誤' : '選択'})</span>
      </p>
      <p className="mb-4 text-lg font-medium">{question.questionText}</p>

      {question.codeSnippet && (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-[#0d1117] p-4 text-sm text-gray-300">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      <div className="space-y-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(option)}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
              selectedAnswer === option
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border hover:bg-accent/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: unknown;
  onSelect: (answer: unknown) => void;
}) {
  const options = question.options as string[];

  return (
    <div className="bg-card rounded-xl border p-6">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        問題 {index + 1}
        <span className="ml-2">(シナリオ)</span>
      </p>

      {question.codeSnippet && (
        <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="mb-2 text-xs font-semibold text-blue-400">シナリオ</p>
          <p className="text-sm whitespace-pre-wrap">{question.codeSnippet}</p>
        </div>
      )}

      <p className="mb-4 text-lg font-medium">{question.questionText}</p>

      <div className="space-y-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(option)}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
              selectedAnswer === option
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border hover:bg-accent/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CodeCompletionCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: unknown;
  onSelect: (answer: unknown) => void;
}) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        問題 {index + 1}
        <span className="ml-2">(コード補完)</span>
      </p>
      <p className="mb-4 text-lg font-medium">{question.questionText}</p>

      {question.codeSnippet && (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-[#0d1117] p-4 text-sm text-gray-300">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      <input
        type="text"
        value={(selectedAnswer as string) ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="回答を入力..."
        className="border-border bg-background w-full rounded-lg border p-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function OrderingCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: unknown;
  onSelect: (answer: unknown) => void;
}) {
  const options = question.options as string[];
  const currentOrder = (selectedAnswer as string[] | null) ?? [...options];

  const moveItem = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= currentOrder.length) return;
      const newOrder = [...currentOrder];
      [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
      onSelect(newOrder);
    },
    [currentOrder, onSelect],
  );

  return (
    <div className="bg-card rounded-xl border p-6">
      <p className="mb-1 text-sm font-medium text-muted-foreground">
        問題 {index + 1}
        <span className="ml-2">(並び替え)</span>
      </p>
      <p className="mb-4 text-lg font-medium">{question.questionText}</p>

      {question.codeSnippet && (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-[#0d1117] p-4 text-sm text-gray-300">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      <div className="space-y-2">
        {currentOrder.map((item, i) => (
          <div
            key={item}
            className="border-border flex items-center gap-2 rounded-lg border p-3"
          >
            <span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {i + 1}
            </span>
            <span className="flex-1 text-sm">{item}</span>
            <div className="flex gap-1">
              <button
                onClick={() => moveItem(i, 'up')}
                disabled={i === 0}
                className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                aria-label="上に移動"
              >
                ▲
              </button>
              <button
                onClick={() => moveItem(i, 'down')}
                disabled={i === currentOrder.length - 1}
                className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                aria-label="下に移動"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedAnswer: unknown;
  onSelect: (answer: unknown) => void;
}) {
  switch (question.questionType) {
    case 'code_completion':
      return (
        <CodeCompletionCard
          question={question}
          index={index}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
        />
      );
    case 'ordering':
      return (
        <OrderingCard
          question={question}
          index={index}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
        />
      );
    case 'scenario':
      return (
        <ScenarioCard
          question={question}
          index={index}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
        />
      );
    default:
      return (
        <MultipleChoiceCard
          question={question}
          index={index}
          selectedAnswer={selectedAnswer}
          onSelect={onSelect}
        />
      );
  }
}

export function QuizContent({ paramsPromise }: { paramsPromise: Promise<{ quizId: string }> }) {
  const { quizId } = use(paramsPromise);
  const router = useRouter();
  const { data: quiz, loading, error } = useApi<QuizDetail>(() => apiClient.getQuiz(quizId));
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());

  const handleSelect = (questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // For ordering questions, the initial order counts as an answer
    const effectiveAnswers = { ...answers };
    for (const q of quiz.questions) {
      if (q.questionType === 'ordering' && !(q.id in effectiveAnswers)) {
        effectiveAnswers[q.id] = q.options as string[];
      }
    }

    const unanswered = quiz.questions.filter((q) => {
      if (q.questionType === 'ordering') return false; // ordering always has a value
      return !(q.id in effectiveAnswers);
    });
    if (unanswered.length > 0) {
      alert(`未回答の問題が${unanswered.length}問あります。すべての問題に回答してください。`);
      return;
    }

    setSubmitting(true);
    try {
      const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await apiClient.submitQuiz(quizId, {
        answers: Object.entries(effectiveAnswers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        timeSpentSeconds,
      });

      // Show achievement toasts
      showAchievementToasts(
        (res.data as { newAchievements?: NewAchievement[] }).newAchievements,
      );

      // Store results in sessionStorage for the results page
      sessionStorage.setItem(
        `quiz-result-${quizId}`,
        JSON.stringify({
          ...res.data,
          quizTitle: quiz.title,
          questions: quiz.questions,
        }),
      );
      router.push(`/quiz/${quizId}/results`);
    } catch {
      alert('クイズの送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card animate-pulse rounded-xl border p-6">
            <div className="bg-muted mb-3 h-5 w-full rounded" />
            <div className="space-y-2">
              <div className="bg-muted h-10 rounded-lg" />
              <div className="bg-muted h-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-destructive">エラーが発生しました: {error ?? 'クイズが見つかりません'}</p>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length +
    quiz.questions.filter((q) => q.questionType === 'ordering' && !(q.id in answers)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          {quiz.module.title} / クイズ
        </p>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <div className="text-muted-foreground mt-2 flex gap-4 text-sm">
          <span>難易度: {quiz.difficulty}</span>
          <span>{quiz.points}ポイント</span>
          <span>{quiz.questions.length}問</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground text-sm">
          {answeredCount}/{quiz.questions.length}
        </span>
      </div>

      {/* Questions */}
      {quiz.questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          selectedAnswer={answers[question.id]}
          onSelect={(answer) => handleSelect(question.id, answer)}
        />
      ))}

      {/* Submit */}
      <div className="border-t pt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 w-full rounded-lg px-6 py-3 font-medium transition-colors"
        >
          {submitting ? '送信中...' : '回答を送信する'}
        </button>
      </div>
    </div>
  );
}
