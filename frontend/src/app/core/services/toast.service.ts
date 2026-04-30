import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(variant: ToastVariant, title: string, message?: string, duration = 4000): number {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, variant, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  info(title: string, message?: string, duration = 4000): number {
    return this.show('info', title, message, duration);
  }

  success(title: string, message?: string, duration = 4000): number {
    return this.show('success', title, message, duration);
  }

  warning(title: string, message?: string, duration = 5000): number {
    return this.show('warning', title, message, duration);
  }

  error(title: string, message?: string, duration = 6000): number {
    return this.show('error', title, message, duration);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
