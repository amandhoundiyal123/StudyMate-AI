export interface LevelInfo {
  name: 'Beginner' | 'Learner' | 'Explorer' | 'Scholar' | 'Expert';
  level: number;
  minXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp || 0));

  if (safeXp >= 1501) {
    return { name: 'Expert', level: 5, minXp: 1501, nextLevelXp: 1501, progressPercent: 100 };
  } else if (safeXp >= 801) {
    const progress = Math.min(100, Math.max(0, Math.round(((safeXp - 801) / (1501 - 801)) * 100)));
    return { name: 'Scholar', level: 4, minXp: 801, nextLevelXp: 1501, progressPercent: progress };
  } else if (safeXp >= 401) {
    const progress = Math.min(100, Math.max(0, Math.round(((safeXp - 401) / (801 - 401)) * 100)));
    return { name: 'Explorer', level: 3, minXp: 401, nextLevelXp: 801, progressPercent: progress };
  } else if (safeXp >= 151) {
    const progress = Math.min(100, Math.max(0, Math.round(((safeXp - 151) / (401 - 151)) * 100)));
    return { name: 'Learner', level: 2, minXp: 151, nextLevelXp: 401, progressPercent: progress };
  } else {
    const progress = Math.min(100, Math.max(0, Math.round((safeXp / 151) * 100)));
    return { name: 'Beginner', level: 1, minXp: 0, nextLevelXp: 151, progressPercent: progress };
  }
}

export function calculateTopicMasteryStatus(
  averageScore: number,
  totalQuizzes: number
): 'Strong' | 'Improving' | 'Needs Revision' | 'Insufficient Data' {
  if (totalQuizzes <= 0) return 'Insufficient Data';
  if (averageScore >= 80) return 'Strong';
  if (averageScore >= 50) return 'Improving';
  return 'Needs Revision';
}

export function calculateQuizXp(
  correctCount: number,
  totalQuestions: number,
  isComeback: boolean
): number {
  if (totalQuestions <= 0) return 0;
  // Base XP for completing
  const base = 50;
  // +10 XP per correct answer
  const correctBonus = Math.max(0, correctCount) * 10;
  // +25 XP bonus for 100% perfect score
  const perfectBonus = correctCount === totalQuestions ? 25 : 0;
  // +40 XP bonus for comeback/score improvement
  const comebackBonus = isComeback ? 40 : 0;
  return base + correctBonus + perfectBonus + comebackBonus;
}
