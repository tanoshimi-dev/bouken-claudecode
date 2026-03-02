import { toast } from 'sonner';
import type { NewAchievement } from '@learn-claude-code/shared-types';

export function showAchievementToast(achievement: NewAchievement) {
  toast.success(`${achievement.badge.icon} ${achievement.badge.name}`, {
    description: 'バッジを獲得しました！',
    duration: 5000,
  });
}

export function showAchievementToasts(achievements: NewAchievement[] | undefined) {
  if (!achievements || achievements.length === 0) return;
  for (const achievement of achievements) {
    showAchievementToast(achievement);
  }
}
