export type LeaderboardKind = 'coins' | 'gems' | 'xp' | 'level' | 'reputation' | 'battles_won';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  level: number | null;
  avatar_url: string | null;
  score: number;
}

export interface MyRank {
  kind: LeaderboardKind;
  rank: number | null;
  score: number | null;
}
