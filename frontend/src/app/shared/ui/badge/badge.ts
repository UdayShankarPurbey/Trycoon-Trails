import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  warning: 'bg-amber-900/40 text-amber-300 border-amber-800',
  danger: 'bg-red-900/40 text-red-300 border-red-800',
  info: 'bg-sky-900/40 text-sky-300 border-sky-800',
  gold: 'bg-amber-500/15 text-amber-300 border-amber-600/40',
};

@Component({
  selector: 'tt-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly classes = computed(() =>
    `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${VARIANTS[this.variant()]}`,
  );
}
