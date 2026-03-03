import type { ContentTypeSlug } from './content-type';

export interface UserProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface ModuleProgress {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  contentType: ContentTypeSlug;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  latestQuizScore: { score: number; maxScore: number } | null;
}

export interface ContentTypeProgress {
  contentType: ContentTypeSlug;
  totalLessons: number;
  completedLessons: number;
  overallPercent: number;
}

export interface OverallProgress {
  totalLessons: number;
  completedLessons: number;
  overallPercent: number;
  byContentType: ContentTypeProgress[];
  modules: ModuleProgress[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}
