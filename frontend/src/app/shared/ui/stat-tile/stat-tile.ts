import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'tt-stat-tile',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg bg-zinc-900 border border-zinc-800 p-4 flex items-center gap-3">
      @if (icon(); as ic) {
        <span [class]="'shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md ' + accent()">
          <lucide-angular [img]="ic" [size]="18" />
        </span>
      }
      <div class="min-w-0">
        <p class="text-xs text-zinc-400 truncate">{{ label() }}</p>
        <p class="text-lg font-semibold text-zinc-100 truncate tabular-nums">{{ value() }}</p>
        @if (sublabel()) {
          <p class="text-[11px] text-zinc-500 truncate">{{ sublabel() }}</p>
        }
      </div>
    </div>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly sublabel = input<string | null>(null);
  readonly icon = input<LucideIconData | null>(null);
  readonly accent = input<string>('bg-amber-500/15 text-amber-300');
}
