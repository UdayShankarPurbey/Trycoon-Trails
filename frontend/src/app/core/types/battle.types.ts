import { User } from './user.types';

export interface BattleUnit {
  army_id: string;
  unit_type_id: number;
  code: string;
  name: string;
  count: number;
  attack: number;
  defense: number;
}

export interface BattleLoss {
  army_id: string;
  code: string;
  count: number;
}

export interface Battle {
  id: string;
  attacker_id: string;
  defender_id: string | null;
  territory_id: string;
  attacker_strength: number;
  defender_strength: number;
  winner_id: string | null;
  territory_captured: boolean;
  attacker_units: BattleUnit[];
  defender_units: BattleUnit[];
  attacker_losses: BattleLoss[];
  defender_losses: BattleLoss[];
  reputation_change: { attacker: number; defender: number };
  notes: string | null;
  attacker?: Pick<User, 'id' | 'username' | 'level'>;
  defender?: Pick<User, 'id' | 'username' | 'level'> | null;
  territory?: { id: string; x: number; y: number; name: string };
  createdAt?: string;
}

export interface AttackResult {
  battle: Battle;
  attackerWon: boolean;
  captured: boolean;
  attacker: { strength: number; losses: BattleLoss[]; units: BattleUnit[] };
  defender: {
    strength: number;
    territoryBonus: number;
    reputationBonus: number;
    losses: BattleLoss[];
    units: BattleUnit[];
  };
  reputationChange: { attacker: number; defender: number };
  balances: { coins: number; reputation: number; xp: number; level: number };
}
