import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { AchievementService } from './achievement.service.js';

const achievementService = new AchievementService();

export class ProgressService {
  async getOverallProgress(userId: string, contentType?: string) {
    const modules = await prisma.module.findMany({
      where: {
        isPublished: true,
        ...(contentType ? { contentType } : {}),
      },
      orderBy: [{ contentType: 'asc' }, { number: 'asc' }],
      include: {
        _count: { select: { lessons: { where: { isPublished: true } } } },
        progress: {
          where: { userId, lessonId: { not: null }, status: 'completed' },
          select: { id: true },
        },
        quizzes: {
          include: {
            attempts: {
              where: { userId },
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { score: true, maxScore: true },
            },
          },
        },
      },
    });

    let totalLessons = 0;
    let completedLessons = 0;
    const ctAccum = new Map<string, { total: number; completed: number }>();

    const moduleProgress = modules.map((m) => {
      const total = m._count.lessons;
      const completed = m.progress.length;
      totalLessons += total;
      completedLessons += completed;

      const acc = ctAccum.get(m.contentType) ?? { total: 0, completed: 0 };
      acc.total += total;
      acc.completed += completed;
      ctAccum.set(m.contentType, acc);

      const latestQuiz = m.quizzes[0]?.attempts[0];

      return {
        moduleId: m.id,
        moduleNumber: m.number,
        moduleTitle: m.title,
        contentType: m.contentType,
        totalLessons: total,
        completedLessons: completed,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        latestQuizScore: latestQuiz ? { score: latestQuiz.score, maxScore: latestQuiz.maxScore } : null,
      };
    });

    const byContentType = Array.from(ctAccum.entries()).map(([ct, data]) => ({
      contentType: ct,
      totalLessons: data.total,
      completedLessons: data.completed,
      overallPercent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

    return {
      totalLessons,
      completedLessons,
      overallPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      byContentType,
      modules: moduleProgress,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, moduleId: true },
    });

    if (!lesson) {
      throw new AppError(404, 'Lesson not found');
    }

    // Upsert lesson progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_moduleId_lessonId: {
          userId,
          moduleId: lesson.moduleId,
          lessonId: lesson.id,
        },
      },
      update: {
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        userId,
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Check if all lessons in module are completed
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({
        where: { moduleId: lesson.moduleId, isPublished: true },
      }),
      prisma.userProgress.count({
        where: {
          userId,
          moduleId: lesson.moduleId,
          lessonId: { not: null },
          status: 'completed',
        },
      }),
    ]);

    const moduleCompleted = completedLessons >= totalLessons;

    if (moduleCompleted) {
      await prisma.userProgress.upsert({
        where: {
          userId_moduleId_lessonId: {
            userId,
            moduleId: lesson.moduleId,
            lessonId: '', // Module-level progress has empty lessonId
          },
        },
        update: { status: 'completed', completedAt: new Date() },
        create: {
          userId,
          moduleId: lesson.moduleId,
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    // Update streak
    await this.updateStreak(userId);

    // Check and award badges
    const newAchievements = await achievementService.checkAndAwardBadges(userId);

    return {
      lessonCompleted: true,
      moduleCompleted,
      progress: {
        completedLessons,
        totalLessons,
      },
      newAchievements,
    };
  }

  async getStreakInfo(userId: string) {
    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastActivityDate: streak?.lastActivityDate ?? null,
    };
  }

  private async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.userStreak.findUnique({ where: { userId } });

    if (!streak) {
      await prisma.userStreak.create({
        data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
      });
      return;
    }

    const lastActivity = streak.lastActivityDate
      ? new Date(streak.lastActivityDate)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        // Already recorded today
        return;
      } else if (diffDays === 1) {
        // Consecutive day
        const newStreak = streak.currentStreak + 1;
        await prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastActivityDate: today,
          },
        });
      } else {
        // Streak broken
        await prisma.userStreak.update({
          where: { userId },
          data: { currentStreak: 1, lastActivityDate: today },
        });
      }
    }
  }
}
