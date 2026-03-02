export interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'lesson' | 'quiz' | 'streak' | 'special';
}

export interface UserAchievement {
  badge: Badge;
  earnedAt: string;
}

export interface AchievementProgress {
  badge: Badge;
  earned: boolean;
  earnedAt: string | null;
  progress: { current: number; target: number } | null;
}

export interface NewAchievement {
  badge: Badge;
  earnedAt: string;
}
