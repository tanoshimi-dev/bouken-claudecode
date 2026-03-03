import { Hono } from 'hono';
import { CONTENT_TYPES } from '@learn-ai/shared-types';
import { prisma } from '../lib/prisma.js';

export const contentTypeRoutes = new Hono();

// Get available content types with module counts
contentTypeRoutes.get('/', async (c) => {
  const counts = await prisma.module.groupBy({
    by: ['contentType'],
    where: { isPublished: true },
    _count: { id: true },
  });

  const countMap = new Map(counts.map((r) => [r.contentType, r._count.id]));

  const types = Object.values(CONTENT_TYPES).map((ct) => ({
    ...ct,
    moduleCount: countMap.get(ct.slug) ?? 0,
    hasContent: (countMap.get(ct.slug) ?? 0) > 0,
  }));

  return c.json({ data: types });
});
