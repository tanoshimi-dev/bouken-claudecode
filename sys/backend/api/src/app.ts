import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { moduleRoutes } from './routes/modules.js';
import { quizRoutes } from './routes/quizzes.js';
import { progressRoutes } from './routes/progress.js';
import { playgroundRoutes } from './routes/playground.js';
import { achievementRoutes } from './routes/achievements.js';
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
app.route('/playground', playgroundRoutes);
app.route('/achievements', achievementRoutes);

export default app;
