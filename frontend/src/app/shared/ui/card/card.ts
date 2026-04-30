import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

@Component({
  selector: 'tt-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="classes()">
      @if (title()) {
        <header class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-zinc-100">{{ title() }}</h3>
            @if (subtitle()) {
              <p class="text-xs text-zinc-400 mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          <ng-content select="[card-actions]" />
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class CardComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly padding = input<CardPadding>('md');
  readonly hoverable = input<boolean>(false);

  readonly classes = computed(() => {
    const parts = [
      'rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100',
      PADDING[this.padding()],
    ];
    if (this.hoverable()) parts.push('transition hover:border-zinc-700 hover:shadow-lg');
    return parts.join(' ');
  });
}
