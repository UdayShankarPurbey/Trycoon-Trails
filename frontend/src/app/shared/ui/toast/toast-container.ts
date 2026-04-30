import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-angular';
import { Toast, ToastService, ToastVariant } from '../../../core/services/toast.service';

const VARIANT_BORDER: Record<ToastVariant, string> = {
  info: 'border-sky-700',
  success: 'border-emerald-700',
  warning: 'border-amber-700',
  error: 'border-red-700',
};

const VARIANT_TEXT: Record<ToastVariant, string> = {
  info: 'text-sky-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  error: 'text-red-300',
};

@Component({
  selector: 'tt-toast-container',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'fixed top-4 right-4 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]' },
  template: `
    @for (t of toasts(); track t.id) {
      <div
        role="status"
        [class]="'rounded-md bg-zinc-900 shadow-xl border-l-4 ' + border(t.variant)
          + ' p-3 pr-9 relative animate-[slide-in_0.2s_ease-out]'"
        [attr.aria-live]="t.variant === 'error' ? 'assertive' : 'polite'">
        <div class="flex items-start gap-2">
          <span [class]="'mt-0.5 ' + iconColor(t.variant)">
            <lucide-angular [img]="iconFor(t.variant)" [size]="18" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-zinc-100 leading-tight">{{ t.title }}</p>
            @if (t.message) {
              <p class="text-xs text-zinc-300 mt-0.5">{{ t.message }}</p>
            }
          </div>
        </div>
        <button
          type="button"
          (click)="dismiss(t.id)"
          class="absolute top-2 right-2 text-zinc-500 hover:text-zinc-200"
          [attr.aria-label]="'Dismiss'">
          <lucide-angular [img]="X" [size]="14" />
        </button>
      </div>
    }
  `,
  styles: `
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected readonly X = X;

  protected iconFor(variant: ToastVariant) {
    return variant === 'success' ? CheckCircle2 : variant === 'error' ? XCircle : variant === 'warning' ? AlertTriangle : Info;
  }
  protected border(variant: ToastVariant): string {
    return VARIANT_BORDER[variant];
  }
  protected iconColor(variant: ToastVariant): string {
    return VARIANT_TEXT[variant];
  }
  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
