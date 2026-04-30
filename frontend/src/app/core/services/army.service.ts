import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MyArmySummary, RecruitPayload, UnitType } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ArmyService {
  private readonly api = inject(ApiService);

  listTypes(): Observable<{ types: UnitType[] }> {
    return this.api.get('/army/types');
  }

  myArmy(): Observable<MyArmySummary> {
    return this.api.get('/users/me/army');
  }

  recruit(payload: RecruitPayload): Observable<unknown> {
    return this.api.post('/army/recruit', payload);
  }

  disband(armyId: string, count: number): Observable<unknown> {
    return this.api.post(`/army/${armyId}/disband`, { count });
  }
}
