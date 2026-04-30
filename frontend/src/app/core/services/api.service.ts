import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiErrorBody, ApiResponse } from '../types';

export interface RequestOptions {
  params?: object;
  context?: HttpContext;
  withCredentials?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly fieldErrors: { field?: string; message: string }[] = [],
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const buildParams = (input?: object): HttpParams => {
  let params = new HttpParams();
  if (!input) return params;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    params = params.set(key, String(value));
  }
  return params;
};

const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;
  if (err instanceof HttpErrorResponse) {
    const body = err.error as ApiErrorBody | undefined;
    const message = body?.message ?? err.message ?? 'Network error';
    const status = body?.statusCode ?? err.status ?? 0;
    return new ApiError(status, message, body?.errors ?? [], body);
  }
  return new ApiError(0, (err as Error)?.message ?? 'Unknown error', [], err);
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), {
        params: buildParams(options?.params),
        context: options?.context,
        withCredentials: options?.withCredentials,
      })
      .pipe(map((res) => res.data), catchError((e) => throwError(() => toApiError(e))));
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body ?? {}, {
        params: buildParams(options?.params),
        context: options?.context,
        withCredentials: options?.withCredentials,
      })
      .pipe(map((res) => res.data), catchError((e) => throwError(() => toApiError(e))));
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.url(path), body ?? {}, {
        params: buildParams(options?.params),
        context: options?.context,
        withCredentials: options?.withCredentials,
      })
      .pipe(map((res) => res.data), catchError((e) => throwError(() => toApiError(e))));
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path), {
        params: buildParams(options?.params),
        context: options?.context,
        withCredentials: options?.withCredentials,
      })
      .pipe(map((res) => res.data), catchError((e) => throwError(() => toApiError(e))));
  }

  upload<T>(path: string, form: FormData, options?: RequestOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), form, {
        params: buildParams(options?.params),
        context: options?.context,
        withCredentials: options?.withCredentials,
      })
      .pipe(map((res) => res.data), catchError((e) => throwError(() => toApiError(e))));
  }

  private url(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
