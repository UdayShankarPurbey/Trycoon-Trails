export type ResourceKind = 'coins' | 'gems' | 'manpower' | 'reputation' | 'xp';

export interface ResourceTransaction {
  id: string;
  user_id: string;
  kind: ResourceKind;
  amount: number;
  balance_after: number;
  reason: string;
  metadata: unknown;
  createdAt: string;
}
