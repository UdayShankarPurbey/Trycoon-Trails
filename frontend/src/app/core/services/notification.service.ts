import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AppNotification, Paginated } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  private readonly _unread = signal<number>(0);
  readonly unread = this._unread.asReadonly();

  list(opts?: { limit?: number; offset?: number; unread?: 'true' | 'false' }): Observable<Paginated<AppNotification>> {
    return this.api.get('/notifications', { params: opts });
  }

  fetchUnread(): Observable<{ unread: number }> {
    return this.api.get<{ unread: number }>('/notifications/unread-count').pipe(
      tap((res) => this._unread.set(res.unread)),
    );
  }

  refreshUnread(): void {
    this.fetchUnread().subscribe({
      next: () => undefined,
      error: () => undefined,
    });
  }

  markRead(id: string): Observable<AppNotification> {
    return this.api.post<AppNotification>(`/notifications/${id}/read`).pipe(
      tap(() => this._unread.update((n) => Math.max(0, n - 1))),
    );
  }

  markAllRead(): Observable<{ marked: number }> {
    return this.api.post<{ marked: number }>('/notifications/read-all').pipe(
      tap(() => this._unread.set(0)),
    );
  }
}
