import { prisma } from '../lib/prisma.js';
import type { Badge, UserAchievement, AchievementProgress, NewAchievement } from '@learn-claude-code/shared-types';

export const BADGES: Badge[] = [
  // Lesson badges
  {
    slug: 'first-lesson',
    name: 'はじめの一歩',
    description: '最初のレッスンを完了した',
    icon: '🎯',
    category: 'lesson',
  },
  {
    slug: 'five-lessons',
    name: '学習の習慣',
    description: '5つのレッスンを完了した',
    icon: '📚',
    category: 'lesson',
  },
  {
    slug: 'ten-lessons',
    name: '知識の探求者',
    description: '10のレッスンを完了した',
    icon: '🔍',
    category: 'lesson',
  },
  {
    slug: 'all-lessons',
    name: 'マスター学習者',
    description: 'すべてのレッスンを完了した',
    icon: '🏆',
    category: 'lesson',
  },
  {
    slug: 'first-module',
    name: 'モジュール制覇',
    description: '最初のモジュールを完了した',
    icon: '📦',
    category: 'lesson',
  },
  {
    slug: 'three-modules',
    name: '中級者',
    description: '3つのモジュールを完了した',
    icon: '🎓',
    category: 'lesson',
  },

  // Quiz badges
  {
    slug: 'first-quiz',
    name: 'クイズ挑戦者',
    description: '最初のクイズに回答した',
    icon: '❓',
    category: 'quiz',
  },
  {
    slug: 'perfect-score',
    name: 'パーフェクト',
    description: 'クイズで満点を取った',
    icon: '💯',
    category: 'quiz',
  },
  {
    slug: 'five-quizzes',
    name: 'クイズマスター',
    description: '5つのクイズに回答した',
    icon: '🧠',
    category: 'quiz',
  },

  // Streak badges
  {
    slug: 'streak-3',
    name: '3日連続',
    description: '3日連続で学習した',
    icon: '🔥',
    category: 'streak',
  },
  {
    slug: 'streak-7',
    name: '一週間の努力',
    description: '7日連続で学習した',
    icon: '⚡',
    category: 'streak',
  },
  {
    slug: 'streak-30',
    name: '継続の達人',
    description: '30日連続で学習した',
    icon: '👑',
    category: 'streak',
  },

  // Special badges
  {
    slug: 'first-snippet',
    name: 'コード保存',
    description: '最初のスニペットを保存した',
    icon: '💾',
    category: 'special',
  },
];

const BADGE_MAP = new Map(BADGES.map((b) => [b.slug, b]));

export class AchievementService {
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const earned = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    return earned
      .map((a) => {
        const badge = BADGE_MAP.get(a.badgeSlug);
        if (!badge) return null;
        return { badge, earnedAt: a.earnedAt.toISOString() };
      })
      .filter((a): a is UserAchievement => a !== null);
  }

  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const earned = await prisma.userAchievement.findMany({
      where: { userId },
    });
    const earnedMap = new Map(earned.map((a) => [a.badgeSlug, a.earnedAt]));

    // Fetch counts for progress
    const [completedLessons, totalLessons, completedModules, quizAttempts, perfectScores, streak, snippetCount] =
      await Promise.all([
        prisma.userProgress.count({
          where: { userId, lessonId: { not: null }, status: 'completed' },
        }),
        prisma.lesson.count({ where: { isPublished: true } }),
        prisma.userProgress.count({
          where: { userId, lessonId: null, status: 'completed' },
        }),
        prisma.userQuizAttempt.count({ where: { userId } }),
        prisma.userQuizAttempt.count({
          where: { userId, score: { equals: prisma.userQuizAttempt.fields?.maxScore } },
        }).catch(() =>
          // Fallback: query perfect scores manually
          prisma.userQuizAttempt.findMany({ where: { userId } }).then(
            (attempts) => attempts.filter((a) => a.score === a.maxScore).length,
          ),
        ),
        prisma.userStreak.findUnique({ where: { userId } }),
        prisma.playgroundSnippet.count({ where: { userId } }),
      ]);

    const longestStreak = streak?.longestStreak ?? 0;

    return BADGES.map((badge) => {
      const earnedAt = earnedMap.get(badge.slug);
      const progress = this.getBadgeProgress(badge.slug, {
        completedLessons,
        totalLessons,
        completedModules,
        quizAttempts,
        perfectScores: typeof perfectScores === 'number' ? perfectScores : 0,
        longestStreak,
        snippetCount,
      });

      return {
        badge,
        earned: !!earnedAt,
        earnedAt: earnedAt?.toISOString() ?? null,
        progress,
      };
    });
  }

  async checkAndAwardBadges(userId: string): Promise<NewAchievement[]> {
    const [completedLessons, totalLessons, completedModules, quizAttempts, perfectScores, streak, snippetCount] =
      await Promise.all([
        prisma.userProgress.count({
          where: { userId, lessonId: { not: null }, status: 'completed' },
        }),
        prisma.lesson.count({ where: { isPublished: true } }),
        prisma.userProgress.count({
          where: { userId, lessonId: null, status: 'completed' },
        }),
        prisma.userQuizAttempt.count({ where: { userId } }),
        prisma.userQuizAttempt.findMany({ where: { userId } }).then(
          (attempts) => attempts.filter((a) => a.score === a.maxScore).length,
        ),
        prisma.userStreak.findUnique({ where: { userId } }),
        prisma.playgroundSnippet.count({ where: { userId } }),
      ]);

    const longestStreak = streak?.longestStreak ?? 0;
    const currentStreak = streak?.currentStreak ?? 0;
    const maxStreak = Math.max(longestStreak, currentStreak);

    const slugsToAward: string[] = [];

    // Lesson badges
    if (completedLessons >= 1) slugsToAward.push('first-lesson');
    if (completedLessons >= 5) slugsToAward.push('five-lessons');
    if (completedLessons >= 10) slugsToAward.push('ten-lessons');
    if (totalLessons > 0 && completedLessons >= totalLessons) slugsToAward.push('all-lessons');

    // Module badges
    if (completedModules >= 1) slugsToAward.push('first-module');
    if (completedModules >= 3) slugsToAward.push('three-modules');

    // Quiz badges
    if (quizAttempts >= 1) slugsToAward.push('first-quiz');
    if (perfectScores >= 1) slugsToAward.push('perfect-score');
    if (quizAttempts >= 5) slugsToAward.push('five-quizzes');

    // Streak badges
    if (maxStreak >= 3) slugsToAward.push('streak-3');
    if (maxStreak >= 7) slugsToAward.push('streak-7');
    if (maxStreak >= 30) slugsToAward.push('streak-30');

    // Special badges
    if (snippetCount >= 1) slugsToAward.push('first-snippet');

    if (slugsToAward.length === 0) return [];

    // Get already-earned slugs
    const alreadyEarned = await prisma.userAchievement.findMany({
      where: { userId, badgeSlug: { in: slugsToAward } },
      select: { badgeSlug: true },
    });
    const alreadyEarnedSet = new Set(alreadyEarned.map((a) => a.badgeSlug));

    const newSlugs = slugsToAward.filter((s) => !alreadyEarnedSet.has(s));
    if (newSlugs.length === 0) return [];

    const now = new Date();
    await prisma.userAchievement.createMany({
      data: newSlugs.map((slug) => ({ userId, badgeSlug: slug, earnedAt: now })),
      skipDuplicates: true,
    });

    return newSlugs
      .map((slug) => {
        const badge = BADGE_MAP.get(slug);
        if (!badge) return null;
        return { badge, earnedAt: now.toISOString() };
      })
      .filter((a): a is NewAchievement => a !== null);
  }

  private getBadgeProgress(
    slug: string,
    stats: {
      completedLessons: number;
      totalLessons: number;
      completedModules: number;
      quizAttempts: number;
      perfectScores: number;
      longestStreak: number;
      snippetCount: number;
    },
  ): { current: number; target: number } | null {
    switch (slug) {
      case 'first-lesson':
        return { current: Math.min(stats.completedLessons, 1), target: 1 };
      case 'five-lessons':
        return { current: Math.min(stats.completedLessons, 5), target: 5 };
      case 'ten-lessons':
        return { current: Math.min(stats.completedLessons, 10), target: 10 };
      case 'all-lessons':
        return { current: stats.completedLessons, target: stats.totalLessons };
      case 'first-module':
        return { current: Math.min(stats.completedModules, 1), target: 1 };
      case 'three-modules':
        return { current: Math.min(stats.completedModules, 3), target: 3 };
      case 'first-quiz':
        return { current: Math.min(stats.quizAttempts, 1), target: 1 };
      case 'perfect-score':
        return { current: Math.min(stats.perfectScores, 1), target: 1 };
      case 'five-quizzes':
        return { current: Math.min(stats.quizAttempts, 5), target: 5 };
      case 'streak-3':
        return { current: Math.min(stats.longestStreak, 3), target: 3 };
      case 'streak-7':
        return { current: Math.min(stats.longestStreak, 7), target: 7 };
      case 'streak-30':
        return { current: Math.min(stats.longestStreak, 30), target: 30 };
      case 'first-snippet':
        return { current: Math.min(stats.snippetCount, 1), target: 1 };
      default:
        return null;
    }
  }
}
