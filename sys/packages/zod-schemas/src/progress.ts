import { z } from 'zod';

export const lessonCompleteParamsSchema = z.object({
  lessonId: z.string(),
});

export type LessonCompleteParams = z.infer<typeof lessonCompleteParamsSchema>;
