import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Terrain, Territory } from '../../../core/types';
import {
  TERRAIN_STYLES,
  WorldFilter,
  matchesFilter,
  ownershipBorder,
  ownershipOf,
} from '../world-utils';

@Component({
  selector: 'tt-world-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid gap-px bg-zinc-900 p-2 rounded-md border border-zinc-800 mx-auto"
      role="grid"
      [style.grid-template-columns]="cols()"
      [style.max-width.px]="800">
      @for (tile of tiles(); track tile.id) {
        <button
          type="button"
          role="gridcell"
          [attr.aria-label]="ariaFor(tile)"
          [attr.title]="ariaFor(tile)"
          [class]="classFor(tile)"
          (click)="tileSelected.emit(tile)">
        </button>
      }
    </div>
  `,
})
export class WorldGridComponent {
  readonly tiles = input.required<Territory[]>();
  readonly size = input<number>(50);
  readonly selectedId = input<string | null>(null);
  readonly currentUserId = input<string | null>(null);
  readonly filter = input<WorldFilter>('all');
  readonly terrain = input<Terrain | null>(null);

  readonly tileSelected = output<Territory>();

  protected readonly cols = computed(() => `repeat(${this.size()}, minmax(0, 1fr))`);

  protected ariaFor(tile: Territory): string {
    const owner = tile.owner?.username ?? 'unowned';
    return `(${tile.x},${tile.y}) ${tile.terrain} — ${owner}`;
  }

  protected classFor(tile: Territory): string {
    const style = TERRAIN_STYLES[tile.terrain];
    const own = ownershipOf(tile, this.currentUserId());
    const visible = matchesFilter(tile, this.filter(), this.currentUserId(), this.terrain());
    const selected = this.selectedId() === tile.id;

    const parts = [
      'aspect-square w-full transition cursor-pointer rounded-[1px]',
      style.base,
      visible ? style.hover : 'opacity-25',
      ownershipBorder(own),
    ];
    if (selected) parts.push('ring-2 ring-white scale-110 z-10');
    if (own === 'mine' && visible) parts.push('shadow-[0_0_0_1px_rgba(245,158,11,0.5)]');
    return parts.join(' ');
  }
}
