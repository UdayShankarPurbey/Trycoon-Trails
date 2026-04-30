import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AttackResult, Battle, Paginated, ScoutReport } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BattleService {
  private readonly api = inject(ApiService);

  scout(territoryId: string): Observable<ScoutReport & { balances: { coins: number } }> {
    return this.api.post(`/world/${territoryId}/scout`);
  }

  attack(territoryId: string, units: { army_id: string; count: number }[]): Observable<AttackResult> {
    return this.api.post(`/world/${territoryId}/attack`, { units });
  }

  myBattles(opts?: { limit?: number; offset?: number }): Observable<Paginated<Battle>> {
    return this.api.get('/users/me/battles', { params: opts });
  }

  byId(id: string): Observable<Battle> {
    return this.api.get(`/battles/${id}`);
  }
}
