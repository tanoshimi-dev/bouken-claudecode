import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { UpdateTrackerService } from '../services/update-tracker.service.js';
import {
  createToolVersionSchema,
  createImpactsSchema,
  updateImpactStatusSchema,
  updateToolContentVersionSchema,
} from '@learn-ai/zod-schemas';
import type { AppEnv } from '../types/env.js';

export const adminUpdateRoutes = new Hono<AppEnv>();

const updateTrackerService = new UpdateTrackerService();

// All admin routes require auth
adminUpdateRoutes.use('*', authMiddleware);

// Get all modules with lessons (for impact mapping picker)
adminUpdateRoutes.get('/modules', async (c) => {
  const modules = await updateTrackerService.getAllModulesWithLessons();
  return c.json({ data: modules });
});

// Get pending updates queue
adminUpdateRoutes.get('/queue', async (c) => {
  const queue = await updateTrackerService.getPendingQueue();
  return c.json({ data: queue });
});

// Register a new tool version
adminUpdateRoutes.post('/versions', async (c) => {
  const body = await c.req.json();
  const parsed = createToolVersionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }
  const version = await updateTrackerService.createVersion(parsed.data);
  return c.json({ data: version }, 201);
});

// Add impact mappings to a version
adminUpdateRoutes.post('/versions/:versionId/impacts', async (c) => {
  const versionId = c.req.param('versionId');
  const body = await c.req.json();
  const parsed = createImpactsSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }
  const result = await updateTrackerService.createImpacts(versionId, parsed.data.impacts);
  return c.json({ data: result }, 201);
});

// Update an impact's status
adminUpdateRoutes.patch('/impacts/:impactId', async (c) => {
  const user = c.get('user');
  const impactId = c.req.param('impactId');
  const body = await c.req.json();
  const parsed = updateImpactStatusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }
  const impact = await updateTrackerService.updateImpactStatus(impactId, user.id, parsed.data);
  return c.json({ data: impact });
});

// Update tool's content version
adminUpdateRoutes.patch('/tools/:toolSlug', async (c) => {
  const toolSlug = c.req.param('toolSlug');
  const body = await c.req.json();
  const parsed = updateToolContentVersionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }
  const config = await updateTrackerService.updateToolContentVersion(
    toolSlug,
    parsed.data.currentContentVersion,
  );
  return c.json({ data: config });
});

// Trigger manual version check for all tools
adminUpdateRoutes.post('/check', async (c) => {
  const results = await updateTrackerService.checkAllToolVersions();
  return c.json({ data: { results } });
});
