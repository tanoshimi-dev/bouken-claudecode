import { QuizResultsContent } from './QuizResultsContent';

export default function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  return <QuizResultsContent paramsPromise={params} />;
}
