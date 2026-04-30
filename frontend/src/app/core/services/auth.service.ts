import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ChangePasswordPayload, LoginPayload, SignupPayload, User } from '../types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _user = signal<User | null>(this.readUser());
  private readonly _accessToken = signal<string | null>(this.readToken());

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null && this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  signup(payload: SignupPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/signup', payload)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', payload)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  logout(): Observable<unknown> {
    const refresh = this.readRefresh();
    return this.api
      .post('/auth/logout', refresh ? { refreshToken: refresh } : {})
      .pipe(tap(() => this.clearAuth()));
  }

  refresh(): Observable<AuthResponse> {
    const refresh = this.readRefresh();
    return this.api
      .post<AuthResponse>('/auth/refresh', refresh ? { refreshToken: refresh } : {})
      .pipe(tap((res) => this.persistAuth(res)));
  }

  fetchMe(): Observable<{ user: User }> {
    return this.api
      .get<{ user: User }>('/auth/me')
      .pipe(tap((res) => this.setUser(res.user)));
  }

  changePassword(payload: ChangePasswordPayload): Observable<unknown> {
    return this.api.post('/auth/change-password', payload);
  }

  setUser(user: User | null): void {
    this._user.set(user);
    if (user) {
      localStorage.setItem(environment.userStorageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(environment.userStorageKey);
    }
  }

  clearAuth(): void {
    this._user.set(null);
    this._accessToken.set(null);
    localStorage.removeItem(environment.tokenStorageKey);
    localStorage.removeItem(environment.refreshStorageKey);
    localStorage.removeItem(environment.userStorageKey);
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem(environment.tokenStorageKey, res.accessToken);
    localStorage.setItem(environment.refreshStorageKey, res.refreshToken);
    localStorage.setItem(environment.userStorageKey, JSON.stringify(res.user));
    this._accessToken.set(res.accessToken);
    this._user.set(res.user);
  }

  private readToken(): string | null {
    return localStorage.getItem(environment.tokenStorageKey);
  }

  private readRefresh(): string | null {
    return localStorage.getItem(environment.refreshStorageKey);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(environment.userStorageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
