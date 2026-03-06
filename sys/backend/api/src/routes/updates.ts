import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { UpdateTrackerService } from '../services/update-tracker.service.js';
import type { AppEnv } from '../types/env.js';

export const updateRoutes = new Hono<AppEnv>();

const updateTrackerService = new UpdateTrackerService();

// Get freshness summary across all tools
updateRoutes.get('/summary', authMiddleware, async (c) => {
  const summary = await updateTrackerService.getFreshnessSummary();
  return c.json({ data: summary });
});

// Get recent updates across all tools
updateRoutes.get('/recent', authMiddleware, async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '10', 10);
  const updates = await updateTrackerService.getRecentUpdates(limit);
  return c.json({ data: updates });
});

// Get tool detail with version history
updateRoutes.get('/:toolSlug', authMiddleware, async (c) => {
  const toolSlug = c.req.param('toolSlug');
  const detail = await updateTrackerService.getToolDetail(toolSlug);
  return c.json({ data: detail });
});

// Get specific version detail
updateRoutes.get('/:toolSlug/versions/:versionId', authMiddleware, async (c) => {
  const { toolSlug, versionId } = c.req.param();
  const version = await updateTrackerService.getVersionDetail(toolSlug, versionId);
  return c.json({ data: version });
});
