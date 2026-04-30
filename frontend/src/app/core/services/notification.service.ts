import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppNotification, Paginated } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  list(opts?: { limit?: number; offset?: number; unread?: 'true' | 'false' }): Observable<Paginated<AppNotification>> {
    return this.api.get('/notifications', { params: opts });
  }

  unreadCount(): Observable<{ unread: number }> {
    return this.api.get('/notifications/unread-count');
  }

  markRead(id: string): Observable<AppNotification> {
    return this.api.post(`/notifications/${id}/read`);
  }

  markAllRead(): Observable<{ marked: number }> {
    return this.api.post('/notifications/read-all');
  }
}
