import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MissionClaimResult, MissionItem, MissionType } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly api = inject(ApiService);

  list(type?: MissionType): Observable<{ count: number; items: MissionItem[] }> {
    return this.api.get('/missions', { params: type ? { type } : undefined });
  }

  claim(id: number): Observable<MissionClaimResult> {
    return this.api.post(`/missions/${id}/claim`);
  }
}
