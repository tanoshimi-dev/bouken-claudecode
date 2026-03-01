import { z } from 'zod';

export const quizSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.unknown(),
    }),
  ),
  timeSpentSeconds: z.number().int().min(0),
});

export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;
