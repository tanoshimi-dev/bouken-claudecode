import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { ModuleService } from '../services/module.service.js';
import { isValidContentType } from '@learn-ai/shared-types';

export const moduleRoutes = new Hono();

const moduleService = new ModuleService();

// Get all published modules (optionally filtered by contentType)
moduleRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user') as { id: string };
  const contentType = c.req.query('contentType');
  if (contentType && !isValidContentType(contentType)) {
    return c.json({ error: 'Invalid content type' }, 400);
  }
  const modules = await moduleService.getAllModules(user.id, contentType);
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
