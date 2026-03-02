export interface Quiz {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  _count: { questions: number };
}

export interface QuizQuestion {
  id: string;
  questionType: 'multiple_choice' | 'code_completion' | 'true_false' | 'ordering' | 'scenario';
  questionText: string;
  codeSnippet: string | null;
  options: unknown;
  order: number;
}

export interface QuizDetail {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  module: { id: string; number: number; title: string };
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  answers: { questionId: string; answer: unknown }[];
  timeSpentSeconds: number;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  percentage: number;
  results: {
    questionId: string;
    correct: boolean;
    correctAnswer: unknown;
    explanation: string;
  }[];
}
