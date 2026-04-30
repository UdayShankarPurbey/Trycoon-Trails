import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LeaderboardEntry, LeaderboardKind, MyRank } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly api = inject(ApiService);

  top(kind: LeaderboardKind, opts?: { limit?: number; offset?: number }): Observable<{
    kind: LeaderboardKind;
    limit: number;
    offset: number;
    items: LeaderboardEntry[];
  }> {
    return this.api.get(`/leaderboards/${kind}`, { params: opts });
  }

  myRank(kind: LeaderboardKind): Observable<MyRank> {
    return this.api.get(`/leaderboards/${kind}/me`);
  }
}
