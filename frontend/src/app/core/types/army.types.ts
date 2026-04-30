export type UnitCategory = 'defense' | 'offense' | 'scout';

export interface UnitType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: UnitCategory;
  coin_cost: number;
  manpower_cost: number;
  attack: number;
  defense: number;
  upkeep_per_min: number;
  unlock_level: number;
  is_active: boolean;
}

export interface ArmyGroup {
  id: string;
  count: number;
  territory: { id: string; x: number; y: number; name: string };
  unit_type: UnitType;
  upkeep_per_min_total: number;
}

export interface MyArmySummary {
  manpower: { current: number; cap: number };
  strength: { attack: number; defense: number; groups: number };
  groups: number;
  items: ArmyGroup[];
}

export interface RecruitPayload {
  territory_id: string;
  unit_code?: string;
  unit_type_id?: number;
  count: number;
}
