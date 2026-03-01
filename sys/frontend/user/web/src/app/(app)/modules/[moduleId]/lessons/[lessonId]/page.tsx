import { LessonContent } from './LessonContent';

export default function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  return <LessonContent paramsPromise={params} />;
}
