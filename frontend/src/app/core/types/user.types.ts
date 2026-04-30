export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  manpower: number;
  reputation: number;
  avatar_url: string | null;
  avatar_public_id?: string | null;
  shield_until: string | null;
  last_active_at: string | null;
  last_daily_claim_at?: string | null;
  daily_streak?: number;
  is_banned: boolean;
  banned_reason: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  territory?: unknown;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
