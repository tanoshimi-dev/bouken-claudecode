import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { PlaygroundService } from '../services/playground.service.js';
import { createSnippetSchema } from '@learn-claude-code/zod-schemas';

export const playgroundRoutes = new Hono();

const playgroundService = new PlaygroundService();

// Get templates
playgroundRoutes.get('/templates', authMiddleware, async (c) => {
  const templates = playgroundService.getTemplates();
  return c.json({ data: templates });
});

// List user's snippets
playgroundRoutes.get('/snippets', authMiddleware, async (c) => {
  const user = c.get('user');
  const type = c.req.query('type');
  const snippets = await playgroundService.getSnippets(user.id, type);
  return c.json({ data: snippets });
});

// Create snippet
playgroundRoutes.post('/snippets', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const parsed = createSnippetSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const snippet = await playgroundService.createSnippet(user.id, parsed.data);
  return c.json({ data: snippet }, 201);
});

// Delete snippet
playgroundRoutes.delete('/snippets/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const snippetId = c.req.param('id');
  await playgroundService.deleteSnippet(user.id, snippetId);
  return c.json({ data: { message: '削除しました' } });
});
