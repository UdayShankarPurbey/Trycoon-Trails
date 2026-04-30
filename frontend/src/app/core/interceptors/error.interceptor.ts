import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ApiErrorBody } from '../types';

const SILENT_ENDPOINTS = ['/auth/refresh', '/auth/logout', '/auth/me'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const body = err.error as ApiErrorBody | undefined;
        const message = body?.message ?? err.message ?? 'Network error';
        const status = err.status ?? 0;
        const silent = SILENT_ENDPOINTS.some((p) => req.url.includes(p));

        if (status === 401 && !silent) {
          auth.clearAuth();
          if (!router.url.startsWith('/login') && !router.url.startsWith('/signup')) {
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          toast.warning('Session expired', 'Please log in again.');
        } else if (status === 403 && !silent) {
          toast.error('Forbidden', message);
        } else if (status >= 500) {
          toast.error('Server error', message);
        } else if (status === 0 && !silent) {
          toast.error('Network error', 'Could not reach the server.');
        }
      }
      return throwError(() => err);
    }),
  );
};
