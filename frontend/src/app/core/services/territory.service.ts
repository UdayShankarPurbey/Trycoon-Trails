import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Paginated, Territory } from '../types';
import { ApiService } from './api.service';

export interface WorldQuery {
  limit?: number;
  offset?: number;
  x_min?: number;
  x_max?: number;
  y_min?: number;
  y_max?: number;
  owner_id?: string;
  has_owner?: 'true' | 'false';
  terrain?: string;
}

@Injectable({ providedIn: 'root' })
export class TerritoryService {
  private readonly api = inject(ApiService);

  listWorld(query?: WorldQuery): Observable<Paginated<Territory>> {
    return this.api.get('/world', { params: query });
  }

  byId(id: string): Observable<Territory> {
    return this.api.get(`/world/${id}`);
  }

  atCoords(x: number, y: number): Observable<Territory> {
    return this.api.get(`/world/at/${x}/${y}`);
  }

  myTerritories(): Observable<{ count: number; items: Territory[] }> {
    return this.api.get('/users/me/territories');
  }
}
