import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BusinessType,
  Level,
  Paginated,
  ResourceKind,
  Territory,
  UnitType,
  User,
} from '../types';
import { ApiService } from './api.service';

export interface AdminStats {
  users: { total: number; admins: number; banned: number; active_today: number; active_week: number };
  world: { total_tiles: number; owned: number; unowned: number; ownership_pct: number };
  economy: { total_coins_in_circulation: number; total_gems_in_circulation: number };
  gameplay: { businesses: number; army_units: number; battles_total: number; territories_captured: number };
  content: { missions_total: number; missions_active: number };
  notifications: { total: number; unread: number };
  timestamp: string;
}

export interface AdminMission {
  id: number;
  code: string;
  type: 'daily' | 'story' | 'achievement';
  title: string;
  description: string | null;
  goal_type: string;
  goal_mode: 'add' | 'max';
  goal_value: number;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
  required_level: number;
  sort_order: number;
  is_active: boolean;
}

export interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  payload: unknown;
  ip: string | null;
  createdAt: string;
  admin?: { id: string; username: string };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  // ===== Stats =====
  stats(): Observable<AdminStats> {
    return this.api.get('/admin/stats');
  }

  // ===== Levels =====
  listLevels(): Observable<{ levels: Level[] }> {
    return this.api.get('/admin/levels');
  }
  updateLevel(level: number, payload: Partial<Level>): Observable<Level> {
    return this.api.patch(`/admin/levels/${level}`, payload);
  }

  // ===== Business Types =====
  listBusinessTypes(): Observable<{ types: BusinessType[] }> {
    return this.api.get('/admin/business-types');
  }
  createBusinessType(payload: Partial<BusinessType>): Observable<BusinessType> {
    return this.api.post('/admin/business-types', payload);
  }
  updateBusinessType(id: number, payload: Partial<BusinessType>): Observable<BusinessType> {
    return this.api.patch(`/admin/business-types/${id}`, payload);
  }
  deactivateBusinessType(id: number): Observable<BusinessType> {
    return this.api.delete(`/admin/business-types/${id}`);
  }

  // ===== Unit Types =====
  listUnitTypes(): Observable<{ types: UnitType[] }> {
    return this.api.get('/admin/unit-types');
  }
  createUnitType(payload: Partial<UnitType>): Observable<UnitType> {
    return this.api.post('/admin/unit-types', payload);
  }
  updateUnitType(id: number, payload: Partial<UnitType>): Observable<UnitType> {
    return this.api.patch(`/admin/unit-types/${id}`, payload);
  }
  deactivateUnitType(id: number): Observable<UnitType> {
    return this.api.delete(`/admin/unit-types/${id}`);
  }

  // ===== Missions =====
  listMissions(): Observable<{ missions: AdminMission[] }> {
    return this.api.get('/admin/missions');
  }
  createMission(payload: Partial<AdminMission>): Observable<AdminMission> {
    return this.api.post('/admin/missions', payload);
  }
  updateMission(id: number, payload: Partial<AdminMission>): Observable<AdminMission> {
    return this.api.patch(`/admin/missions/${id}`, payload);
  }
  deactivateMission(id: number): Observable<AdminMission> {
    return this.api.delete(`/admin/missions/${id}`);
  }

  // ===== Territories =====
  listTerritories(opts?: { limit?: number; offset?: number; has_owner?: 'true' | 'false' }): Observable<Paginated<Territory>> {
    return this.api.get('/admin/territories', { params: opts });
  }
  updateTerritory(id: string, payload: Partial<Territory>): Observable<Territory> {
    return this.api.patch(`/admin/territories/${id}`, payload);
  }
  clearTerritory(id: string): Observable<Territory> {
    return this.api.post(`/admin/territories/${id}/clear`);
  }

  // ===== Players =====
  listPlayers(opts?: { limit?: number; offset?: number; q?: string; role?: 'user' | 'admin'; is_banned?: 'true' | 'false' }): Observable<Paginated<User>> {
    return this.api.get('/admin/players', { params: opts });
  }
  getPlayer(id: string): Observable<User & { territories?: { id: string; x: number; y: number; name: string; terrain: string }[] }> {
    return this.api.get(`/admin/players/${id}`);
  }
  banPlayer(id: string, reason: string): Observable<User> {
    return this.api.post(`/admin/players/${id}/ban`, { reason });
  }
  unbanPlayer(id: string): Observable<User> {
    return this.api.post(`/admin/players/${id}/unban`);
  }
  grantToPlayer(id: string, payload: { kind: ResourceKind; amount: number; reason?: string }): Observable<User> {
    return this.api.post(`/admin/players/${id}/grant`, payload);
  }
  setPlayerRole(id: string, role: 'user' | 'admin'): Observable<User> {
    return this.api.post(`/admin/players/${id}/role`, { role });
  }

  // ===== Audit Log =====
  listAuditLog(opts?: { limit?: number; offset?: number; admin_id?: string; action?: string; target_table?: string }): Observable<Paginated<AuditEntry>> {
    return this.api.get('/admin/audit-log', { params: opts });
  }
}
