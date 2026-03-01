import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export class ModuleService {
  async getAllModules(userId: string) {
    const modules = await prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { number: 'asc' },
      include: {
        _count: { select: { lessons: { where: { isPublished: true } } } },
        progress: {
          where: { userId, lessonId: { not: null } },
          select: { status: true },
        },
      },
    });

    return modules.map((m) => {
      const totalLessons = m._count.lessons;
      const completedLessons = m.progress.filter((p) => p.status === 'completed').length;

      return {
        id: m.id,
        number: m.number,
        title: m.title,
        description: m.description,
        estimatedMinutes: m.estimatedMinutes,
        totalLessons,
        completedLessons,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    });
  }

  async getModuleDetail(moduleId: string, userId: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId, isPublished: true },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: { id: true, order: true, title: true, lessonType: true },
        },
        quizzes: {
          select: { id: true, title: true, difficulty: true, points: true },
        },
      },
    });

    if (!module) {
      throw new AppError(404, 'Module not found');
    }

    // Get user progress for lessons
    const progress = await prisma.userProgress.findMany({
      where: { userId, moduleId },
      select: { lessonId: true, status: true },
    });

    const progressMap = new Map(progress.map((p) => [p.lessonId, p.status]));

    return {
      id: module.id,
      number: module.number,
      title: module.title,
      description: module.description,
      estimatedMinutes: module.estimatedMinutes,
      lessons: module.lessons.map((l) => ({
        ...l,
        status: progressMap.get(l.id) ?? 'not_started',
      })),
      quizzes: module.quizzes,
    };
  }

  async getLessonDetail(moduleId: string, lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, moduleId, isPublished: true },
      include: {
        module: { select: { id: true, number: true, title: true } },
      },
    });

    if (!lesson) {
      throw new AppError(404, 'Lesson not found');
    }

    // Get progress status
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_moduleId_lessonId: { userId, moduleId, lessonId },
      },
    });

    // Get prev/next lesson
    const [prevLesson, nextLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: { moduleId, order: { lt: lesson.order }, isPublished: true },
        orderBy: { order: 'desc' },
        select: { id: true, title: true },
      }),
      prisma.lesson.findFirst({
        where: { moduleId, order: { gt: lesson.order }, isPublished: true },
        orderBy: { order: 'asc' },
        select: { id: true, title: true },
      }),
    ]);

    return {
      id: lesson.id,
      order: lesson.order,
      title: lesson.title,
      contentMd: lesson.contentMd,
      lessonType: lesson.lessonType,
      module: lesson.module,
      status: progress?.status ?? 'not_started',
      prevLesson,
      nextLesson,
    };
  }
}
