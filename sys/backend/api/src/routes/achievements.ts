import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { AchievementService } from '../services/achievement.service.js';

export const achievementRoutes = new Hono();

const achievementService = new AchievementService();

// Get user's earned achievements
achievementRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const achievements = await achievementService.getUserAchievements(user.id);
  return c.json({ data: achievements });
});

// Get all badges with progress
achievementRoutes.get('/progress', authMiddleware, async (c) => {
  const user = c.get('user');
  const progress = await achievementService.getAchievementProgress(user.id);
  return c.json({ data: progress });
});
