export type MissionType = 'daily' | 'story' | 'achievement';

export type MissionGoalType =
  | 'buy_business'
  | 'upgrade_business'
  | 'recruit_units'
  | 'win_battle'
  | 'capture_territory'
  | 'reach_level';

export interface MissionItem {
  id: number;
  code: string;
  type: MissionType;
  title: string;
  description: string | null;
  goal_type: MissionGoalType;
  goal_value: number;
  rewards: { coins: number; gems: number; xp: number };
  progress: number;
  completed: boolean;
  claimed: boolean;
  daily_period: string | null;
  claimed_at: string | null;
}

export interface MissionClaimResult {
  mission: { id: number; code: string; title: string };
  rewards: { coins: number; gems: number; xp: number };
  levelUps: { level: number; title: string; reward_coins: number; reward_gems: number; unlocks: string[] }[];
  balances: { coins: number; gems: number; xp: number; level: number };
}
