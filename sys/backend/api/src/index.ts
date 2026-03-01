import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { moduleRoutes } from './routes/modules.js';
import { quizRoutes } from './routes/quizzes.js';
import { progressRoutes } from './routes/progress.js';
import { errorHandler } from './middleware/error-handler.js';
import { env } from './lib/env.js';

const app = new Hono().basePath('/api');

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [env.APP_URL],
    credentials: true,
  }),
);
app.onError(errorHandler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/auth', authRoutes);
app.route('/modules', moduleRoutes);
app.route('/quizzes', quizRoutes);
app.route('/progress', progressRoutes);

const port = env.PORT;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running on http://localhost:${info.port}`);
});

export default app;
