import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'tt-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (label() || showValue()) {
        <div class="flex items-center justify-between text-xs mb-1 text-zinc-400">
          @if (label()) { <span>{{ label() }}</span> }
          @if (showValue()) { <span>{{ value() }} / {{ max() }}</span> }
        </div>
      }
      <div
        class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="max()">
        <div
          class="h-full bg-amber-500 transition-all duration-300"
          [style.width]="widthPct() + '%'">
        </div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly label = input<string | null>(null);
  readonly showValue = input<boolean>(false);

  readonly widthPct = computed(() => {
    const m = this.max();
    if (m <= 0) return 0;
    return Math.min(100, Math.max(0, (this.value() / m) * 100));
  });
}
