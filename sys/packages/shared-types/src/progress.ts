export interface UserProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface ModuleProgress {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  latestQuizScore: { score: number; maxScore: number } | null;
}

export interface OverallProgress {
  totalLessons: number;
  completedLessons: number;
  overallPercent: number;
  modules: ModuleProgress[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}
