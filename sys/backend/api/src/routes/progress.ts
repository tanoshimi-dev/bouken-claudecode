import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { ProgressService } from '../services/progress.service.js';

export const progressRoutes = new Hono();

const progressService = new ProgressService();

// Get user's overall progress
progressRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const progress = await progressService.getOverallProgress(user.id);
  return c.json({ data: progress });
});

// Mark lesson as completed
progressRoutes.post('/lessons/:lessonId', authMiddleware, async (c) => {
  const user = c.get('user');
  const lessonId = c.req.param('lessonId');
  const result = await progressService.completeLesson(user.id, lessonId);
  return c.json({ data: result });
});

// Get streak info
progressRoutes.get('/streaks', authMiddleware, async (c) => {
  const user = c.get('user');
  const streaks = await progressService.getStreakInfo(user.id);
  return c.json({ data: streaks });
});
