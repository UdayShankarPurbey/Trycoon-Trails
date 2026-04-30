import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessType, BuyBusinessPayload, CollectResult, MyBusiness } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly api = inject(ApiService);

  listTypes(): Observable<{ types: BusinessType[] }> {
    return this.api.get('/businesses/types');
  }

  listMine(): Observable<{ count: number; items: MyBusiness[] }> {
    return this.api.get('/users/me/businesses');
  }

  buy(payload: BuyBusinessPayload): Observable<unknown> {
    return this.api.post('/businesses', payload);
  }

  upgrade(id: string): Observable<unknown> {
    return this.api.patch(`/businesses/${id}/upgrade`);
  }

  collect(id: string): Observable<CollectResult> {
    return this.api.post(`/businesses/${id}/collect`);
  }

  collectAll(): Observable<CollectResult> {
    return this.api.post('/businesses/collect-all');
  }
}
