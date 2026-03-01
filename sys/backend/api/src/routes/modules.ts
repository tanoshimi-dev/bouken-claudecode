import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { ModuleService } from '../services/module.service.js';

export const moduleRoutes = new Hono();

const moduleService = new ModuleService();

// Get all published modules
moduleRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const modules = await moduleService.getAllModules(user.id);
  return c.json({ data: modules });
});

// Get module detail with lessons
moduleRoutes.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const moduleId = c.req.param('id');
  const moduleDetail = await moduleService.getModuleDetail(moduleId, user.id);
  return c.json({ data: moduleDetail });
});

// Get lesson detail
moduleRoutes.get('/:moduleId/lessons/:lessonId', authMiddleware, async (c) => {
  const user = c.get('user');
  const { moduleId, lessonId } = c.req.param();
  const lesson = await moduleService.getLessonDetail(moduleId, lessonId, user.id);
  return c.json({ data: lesson });
});
