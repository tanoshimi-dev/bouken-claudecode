import { QuizContent } from './QuizContent';

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  return <QuizContent paramsPromise={params} />;
}
