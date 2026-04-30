export interface BusinessType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_cost: number;
  base_income_per_min: number;
  upgrade_cost_multiplier: number | string;
  upgrade_income_multiplier: number | string;
  unlock_level: number;
  max_level: number;
  is_active: boolean;
}

export interface MyBusiness {
  id: string;
  level: number;
  type: { id: number; code: string; name: string; max_level: number };
  territory: { id: string; x: number; y: number; name: string };
  last_collected_at: string;
  income: { per_minute: number; uncollected: number; minutes_since_collect: number };
  upgrade_cost: number;
}

export interface BuyBusinessPayload {
  territory_id: string;
  type_id?: number;
  type_code?: string;
}

export interface CollectResult {
  earned: number;
  businesses?: number;
  minutes?: number;
  balances: { coins: number };
}
