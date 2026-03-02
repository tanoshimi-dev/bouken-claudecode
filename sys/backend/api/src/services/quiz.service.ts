import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { AchievementService } from './achievement.service.js';

const achievementService = new AchievementService();

export class QuizService {
  async getQuizzesByModule(moduleId: string) {
    return prisma.quiz.findMany({
      where: { moduleId },
      select: {
        id: true,
        title: true,
        difficulty: true,
        points: true,
        _count: { select: { questions: true } },
      },
    });
  }

  async getQuizDetail(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            questionType: true,
            questionText: true,
            codeSnippet: true,
            options: true,
            order: true,
            // NOTE: correctAnswer and explanation are NOT returned
          },
        },
        module: { select: { id: true, number: true, title: true } },
      },
    });

    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }

    return {
      id: quiz.id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      points: quiz.points,
      module: quiz.module,
      questions: quiz.questions,
    };
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    answers: { questionId: string; answer: unknown }[],
    timeSpentSeconds: number,
  ) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }

    // Grade each question
    const results = quiz.questions.map((question) => {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const correct = this.checkAnswer(question.correctAnswer, userAnswer?.answer, question.questionType);

      return {
        questionId: question.id,
        correct,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    });

    const score = results.filter((r) => r.correct).length;
    const maxScore = quiz.questions.length;

    // Save attempt
    await prisma.userQuizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        maxScore,
        answers: answers as never,
        timeSpentSeconds,
      },
    });

    // Check and award badges
    const newAchievements = await achievementService.checkAndAwardBadges(userId);

    return {
      score,
      maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      results,
      newAchievements,
    };
  }

  private checkAnswer(correctAnswer: unknown, userAnswer: unknown, questionType?: string): boolean {
    if (questionType === 'code_completion') {
      const correct = String(correctAnswer).trim().toLowerCase();
      const user = String(userAnswer ?? '').trim().toLowerCase();
      return correct === user;
    }
    return JSON.stringify(correctAnswer) === JSON.stringify(userAnswer);
  }
}
