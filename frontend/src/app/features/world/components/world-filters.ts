import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Terrain } from '../../../core/types';
import { TERRAIN_STYLES, WorldFilter } from '../world-utils';

interface FilterOption { value: WorldFilter; label: string }

const OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'owned', label: 'Owned' },
  { value: 'unowned', label: 'Unowned' },
];

@Component({
  selector: 'tt-world-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden">
        @for (opt of options; track opt.value) {
          <button
            type="button"
            (click)="filterChanged.emit(opt.value)"
            [class]="filterBtn(opt.value)">
            {{ opt.label }}
          </button>
        }
      </div>

      <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden">
        <button
          type="button"
          (click)="terrainChanged.emit(null)"
          [class]="terrainBtn(null)">
          Any terrain
        </button>
        @for (entry of terrains(); track entry.key) {
          <button
            type="button"
            (click)="terrainChanged.emit(entry.key)"
            [class]="terrainBtn(entry.key)">
            <span [class]="'inline-block w-2 h-2 rounded-full mr-1.5 ' + entry.style.base"></span>
            {{ entry.style.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class WorldFiltersComponent {
  readonly filter = input<WorldFilter>('all');
  readonly terrain = input<Terrain | null>(null);

  readonly filterChanged = output<WorldFilter>();
  readonly terrainChanged = output<Terrain | null>();

  protected readonly options = OPTIONS;

  protected readonly terrains = computed(() =>
    (Object.entries(TERRAIN_STYLES) as [Terrain, typeof TERRAIN_STYLES[Terrain]][]).map(([key, style]) => ({ key, style })),
  );

  protected filterBtn(value: WorldFilter): string {
    const active = this.filter() === value;
    return `px-3 h-8 text-xs font-medium ${
      active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  protected terrainBtn(value: Terrain | null): string {
    const active = this.terrain() === value;
    return `px-3 h-8 text-xs font-medium inline-flex items-center ${
      active ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }
}
