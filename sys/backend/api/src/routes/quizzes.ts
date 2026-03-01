import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { QuizService } from '../services/quiz.service.js';

export const quizRoutes = new Hono();

const quizService = new QuizService();

// Get quizzes for a module
quizRoutes.get('/modules/:moduleId', authMiddleware, async (c) => {
  const moduleId = c.req.param('moduleId');
  const quizzes = await quizService.getQuizzesByModule(moduleId);
  return c.json({ data: quizzes });
});

// Get quiz detail with questions (without correct answers)
quizRoutes.get('/:id', authMiddleware, async (c) => {
  const quizId = c.req.param('id');
  const quiz = await quizService.getQuizDetail(quizId);
  return c.json({ data: quiz });
});

// Submit quiz answers
quizRoutes.post('/:id/submit', authMiddleware, async (c) => {
  const user = c.get('user');
  const quizId = c.req.param('id');
  const body = await c.req.json<{
    answers: { questionId: string; answer: unknown }[];
    timeSpentSeconds: number;
  }>();

  const result = await quizService.submitQuiz(user.id, quizId, body.answers, body.timeSpentSeconds);
  return c.json({ data: result });
});
