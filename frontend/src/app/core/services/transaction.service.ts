import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Paginated, ResourceKind, ResourceTransaction } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly api = inject(ApiService);

  listMine(opts?: { limit?: number; offset?: number; kind?: ResourceKind }): Observable<Paginated<ResourceTransaction>> {
    return this.api.get('/users/me/transactions', { params: opts });
  }
}
