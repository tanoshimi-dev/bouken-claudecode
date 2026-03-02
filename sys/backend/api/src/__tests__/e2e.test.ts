import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { createTestUser, cleanupTestUser, authRequest, type TestContext } from './helpers.js';

describe('E2E: 学習フロー', () => {
  let ctx: TestContext;

  // IDs resolved from seeded data
  let moduleId: string;
  let lessonId: string;
  let quizId: string;
  let quizQuestionIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    ctx = await createTestUser();

    // Fetch seeded modules (sorted by number) to get real IDs
    const firstModule = await prisma.module.findFirst({
      where: { isPublished: true },
      orderBy: { number: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
        quizzes: {
          take: 1,
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!firstModule) throw new Error('No seeded modules found. Run db:seed first.');
    if (firstModule.lessons.length === 0) throw new Error('No seeded lessons found.');
    if (firstModule.quizzes.length === 0) throw new Error('No seeded quizzes found.');

    moduleId = firstModule.id;
    lessonId = firstModule.lessons[0].id;
    quizId = firstModule.quizzes[0].id;
    quizQuestionIds = firstModule.quizzes[0].questions.map((q) => q.id);
  });

  afterAll(async () => {
    await cleanupTestUser(ctx.userId);
    await prisma.$disconnect();
  });

  // 1. Health check
  it('GET /api/health → 200', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  // 2. Unauthenticated access
  it('GET /api/auth/me (no token) → 401', async () => {
    const res = await app.request('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // 3. Authenticated user profile
  it('GET /api/auth/me (with token) → 200', async () => {
    const res = await authRequest('GET', '/api/auth/me', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(ctx.userId);
    expect(data.name).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  // 4. List modules
  it('GET /api/modules → 200, modules returned', async () => {
    const res = await authRequest('GET', '/api/modules', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);

    // Verify module shape
    const mod = data[0];
    expect(mod).toHaveProperty('id');
    expect(mod).toHaveProperty('number');
    expect(mod).toHaveProperty('title');
    expect(mod).toHaveProperty('totalLessons');
  });

  // 5. Module detail
  it('GET /api/modules/:id → 200, lessons + quizzes', async () => {
    const res = await authRequest('GET', `/api/modules/${moduleId}`, ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(moduleId);
    expect(Array.isArray(data.lessons)).toBe(true);
    expect(data.lessons.length).toBeGreaterThan(0);
    expect(Array.isArray(data.quizzes)).toBe(true);
    expect(data.quizzes.length).toBeGreaterThan(0);
  });

  // 6. Lesson detail
  it('GET /api/modules/:moduleId/lessons/:lessonId → 200, contentMd', async () => {
    const res = await authRequest(
      'GET',
      `/api/modules/${moduleId}/lessons/${lessonId}`,
      ctx.accessToken,
    );
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(lessonId);
    expect(typeof data.contentMd).toBe('string');
    expect(data.contentMd.length).toBeGreaterThan(0);
    expect(data.module).toBeDefined();
  });

  // 7. Complete lesson
  it('POST /api/progress/lessons/:lessonId → 200, lessonCompleted', async () => {
    const res = await authRequest(
      'POST',
      `/api/progress/lessons/${lessonId}`,
      ctx.accessToken,
    );
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.lessonCompleted).toBe(true);
    expect(data.progress).toBeDefined();
    expect(data.progress.completedLessons).toBeGreaterThanOrEqual(1);
  });

  // 8. Check overall progress
  it('GET /api/progress → 200, completedLessons >= 1', async () => {
    const res = await authRequest('GET', '/api/progress', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.completedLessons).toBeGreaterThanOrEqual(1);
    expect(data.totalLessons).toBeGreaterThan(0);
    expect(Array.isArray(data.modules)).toBe(true);
  });

  // 9. Check streak
  it('GET /api/progress/streaks → 200, currentStreak >= 1', async () => {
    const res = await authRequest('GET', '/api/progress/streaks', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(data.longestStreak).toBeGreaterThanOrEqual(1);
  });

  // 10. Get quiz (no correctAnswer exposed)
  it('GET /api/quizzes/:id → 200, questions without correctAnswer', async () => {
    const res = await authRequest('GET', `/api/quizzes/${quizId}`, ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(quizId);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);

    // correctAnswer must NOT be included
    for (const q of data.questions) {
      expect(q).not.toHaveProperty('correctAnswer');
      expect(q).toHaveProperty('questionText');
      expect(q).toHaveProperty('options');
    }
  });

  // 11. Submit quiz
  it('POST /api/quizzes/:id/submit → 200, score/results', async () => {
    // Fetch correct answers directly from DB to build valid answers
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });

    const answers = questions.map((q) => ({
      questionId: q.id,
      answer: q.correctAnswer,
    }));

    const res = await authRequest('POST', `/api/quizzes/${quizId}/submit`, ctx.accessToken, {
      answers,
      timeSpentSeconds: 60,
    });
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.score).toBe(data.maxScore); // All correct
    expect(data.percentage).toBe(100);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBe(questions.length);
  });

  // 12. Unlink provider — fails when no/single provider linked
  it('DELETE /api/auth/link/google (no provider) → 400', async () => {
    const res = await authRequest('DELETE', '/api/auth/link/google', ctx.accessToken);
    // Test user has no OAuth accounts, so cannot unlink (min 1 required)
    expect(res.status).toBe(400);
  });

  // 13. Link provider start — requires auth
  it('GET /api/auth/link/google (no auth) → 401', async () => {
    const res = await app.request('/api/auth/link/google');
    expect(res.status).toBe(401);
  });

  // 14. Unlink provider — requires auth
  it('DELETE /api/auth/link/google (no auth) → 401', async () => {
    const res = await app.request('/api/auth/link/google', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  // 15. User profile includes linkedAccounts
  it('GET /api/auth/me includes linkedAccounts array', async () => {
    const res = await authRequest('GET', '/api/auth/me', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data.linkedAccounts)).toBe(true);
  });

  // 16. Logout
  it('POST /api/auth/logout → 200', async () => {
    const res = await authRequest('POST', '/api/auth/logout', ctx.accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toBe('Logged out');
  });
});

describe('E2E: Achievements', () => {
  let ctx: TestContext;
  let lessonId: string;

  beforeAll(async () => {
    ctx = await createTestUser();

    const firstModule = await prisma.module.findFirst({
      where: { isPublished: true },
      orderBy: { number: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (!firstModule || firstModule.lessons.length === 0) {
      throw new Error('No seeded modules/lessons found.');
    }
    lessonId = firstModule.lessons[0].id;
  });

  afterAll(async () => {
    await cleanupTestUser(ctx.userId);
  });

  // 1. Get achievements (empty initially)
  it('GET /api/achievements → 200, returns empty array', async () => {
    const res = await authRequest('GET', '/api/achievements', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  // 2. Get achievement progress (all badges with progress)
  it('GET /api/achievements/progress → 200, returns all badges', async () => {
    const res = await authRequest('GET', '/api/achievements/progress', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(13);

    const firstBadge = data[0];
    expect(firstBadge).toHaveProperty('badge');
    expect(firstBadge).toHaveProperty('earned');
    expect(firstBadge).toHaveProperty('progress');
    expect(firstBadge.badge).toHaveProperty('slug');
    expect(firstBadge.badge).toHaveProperty('name');
    expect(firstBadge.badge).toHaveProperty('icon');
    expect(firstBadge.badge).toHaveProperty('category');
  });

  // 3. Complete lesson and verify newAchievements in response
  it('POST /api/progress/lessons/:lessonId → returns newAchievements with first-lesson', async () => {
    const res = await authRequest(
      'POST',
      `/api/progress/lessons/${lessonId}`,
      ctx.accessToken,
    );
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.lessonCompleted).toBe(true);
    expect(Array.isArray(data.newAchievements)).toBe(true);
    expect(data.newAchievements.length).toBeGreaterThanOrEqual(1);

    const firstLessonBadge = data.newAchievements.find(
      (a: { badge: { slug: string } }) => a.badge.slug === 'first-lesson',
    );
    expect(firstLessonBadge).toBeDefined();
    expect(firstLessonBadge.badge.name).toBe('はじめの一歩');
  });

  // 4. Get achievements — should now have earned badges
  it('GET /api/achievements → returns earned badges', async () => {
    const res = await authRequest('GET', '/api/achievements', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0]).toHaveProperty('badge');
    expect(data[0]).toHaveProperty('earnedAt');
  });

  // 5. Unauthenticated access
  it('GET /api/achievements (no auth) → 401', async () => {
    const res = await app.request('/api/achievements');
    expect(res.status).toBe(401);
  });

  it('GET /api/achievements/progress (no auth) → 401', async () => {
    const res = await app.request('/api/achievements/progress');
    expect(res.status).toBe(401);
  });
});

describe('E2E: Playground', () => {
  let ctx: TestContext;
  let snippetId: string;

  beforeAll(async () => {
    ctx = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser(ctx.userId);
  });

  // 1. Get templates
  it('GET /api/playground/templates → 200, returns templates', async () => {
    const res = await authRequest('GET', '/api/playground/templates', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('content');
    expect(data[0]).toHaveProperty('type');
  });

  // 2. Create snippet
  it('POST /api/playground/snippets → 201, creates snippet', async () => {
    const res = await authRequest('POST', '/api/playground/snippets', ctx.accessToken, {
      title: 'テストスニペット',
      type: 'claude_md',
      content: '# Test CLAUDE.md\n\n## Memory\n- テスト',
    });
    expect(res.status).toBe(201);

    const { data } = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('テストスニペット');
    expect(data.type).toBe('claude_md');
    expect(data.content).toContain('# Test CLAUDE.md');
    snippetId = data.id;
  });

  // 3. List snippets
  it('GET /api/playground/snippets → 200, returns user snippets', async () => {
    const res = await authRequest('GET', '/api/playground/snippets', ctx.accessToken);
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  // 4. Filter snippets by type
  it('GET /api/playground/snippets?type=claude_md → filtered', async () => {
    const res = await authRequest(
      'GET',
      '/api/playground/snippets?type=claude_md',
      ctx.accessToken,
    );
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.every((s: { type: string }) => s.type === 'claude_md')).toBe(true);
  });

  // 5. Delete snippet
  it('DELETE /api/playground/snippets/:id → 200', async () => {
    const res = await authRequest(
      'DELETE',
      `/api/playground/snippets/${snippetId}`,
      ctx.accessToken,
    );
    expect(res.status).toBe(200);
  });

  // 6. Unauthenticated access
  it('GET /api/playground/snippets (no auth) → 401', async () => {
    const res = await app.request('/api/playground/snippets');
    expect(res.status).toBe(401);
  });
});
