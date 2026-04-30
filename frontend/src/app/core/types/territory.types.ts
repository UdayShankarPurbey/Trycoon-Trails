import { User } from './user.types';

export type Terrain = 'plains' | 'forest' | 'mountain' | 'coast' | 'desert';

export interface Territory {
  id: string;
  x: number;
  y: number;
  name: string;
  terrain: Terrain;
  business_capacity: number;
  defense_bonus: number;
  income_multiplier: number | string;
  owner_id: string | null;
  owner?: Pick<User, 'id' | 'username' | 'level' | 'avatar_url' | 'shield_until' | 'last_active_at'> | null;
  captured_at: string | null;
  capture_cooldown_until: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoutReport {
  territory: Pick<Territory, 'id' | 'x' | 'y' | 'name' | 'terrain' | 'defense_bonus' | 'capture_cooldown_until'>;
  owner: Pick<User, 'id' | 'username' | 'level' | 'reputation' | 'shield_until'> | null;
  defender_strength: number;
  armies: { unit_type: { id: number; code: string; name: string; attack: number; defense: number }; count: number }[];
}
