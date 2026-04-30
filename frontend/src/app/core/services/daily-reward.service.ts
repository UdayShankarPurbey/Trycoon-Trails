import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DailyRewardResult {
  streak: number;
  reward: { coins: number; gems: number; xp: number };
  levelUps: { level: number; title: string; reward_coins: number; reward_gems: number; unlocks: string[] }[];
  balances: { coins: number; gems: number; xp: number; level: number };
}

@Injectable({ providedIn: 'root' })
export class DailyRewardService {
  private readonly api = inject(ApiService);

  claim(): Observable<DailyRewardResult> {
    return this.api.post('/users/me/daily-reward');
  }
}
