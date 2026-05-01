import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChangePasswordPayload, User } from '../types';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  getMe(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/users/me').pipe(
      tap((res) => this.auth.setUser(res.user)),
    );
  }

  updateProfile(payload: { username?: string }): Observable<{ user: User }> {
    return this.api.patch<{ user: User }>('/users/me', payload).pipe(
      tap((res) => this.auth.setUser(res.user)),
    );
  }

  uploadAvatar(file: File): Observable<{ user: User }> {
    const form = new FormData();
    form.append('avatar', file);
    return this.api.upload<{ user: User }>('/users/me/avatar', form).pipe(
      tap((res) => this.auth.setUser(res.user)),
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<unknown> {
    return this.api.post('/auth/change-password', payload);
  }
}
