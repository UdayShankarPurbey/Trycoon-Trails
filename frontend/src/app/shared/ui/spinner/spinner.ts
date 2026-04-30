import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const SIZE_PX: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
};

@Component({
  selector: 'tt-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="classes()"
      role="status"
      [attr.aria-label]="label()">
    </span>
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input<string>('Loading');

  readonly classes = computed(
    () =>
      `inline-block ${SIZE_PX[this.size()]} border-zinc-700 border-t-amber-500 rounded-full animate-spin`,
  );
}
