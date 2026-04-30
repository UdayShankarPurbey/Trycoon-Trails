export interface Level {
  level: number;
  title: string;
  xp_required: number;
  reward_coins: number;
  reward_gems: number;
  unlocks: string[];
}

export interface MyLevelInfo {
  level: number;
  title: string | null;
  xp: number;
  xpAtCurrent: number;
  xpForNext: number | null;
  xpToNext: number;
  progress: number;
  unlocks: string[];
  nextLevel: { level: number; title: string; xp_required: number; unlocks: string[] } | null;
}
