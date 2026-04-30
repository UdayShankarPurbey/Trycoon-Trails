import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Terrain } from '../../../core/types';
import { TERRAIN_STYLES } from '../world-utils';

@Component({
  selector: 'tt-world-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
      @for (entry of terrains(); track entry.key) {
        <span class="inline-flex items-center gap-1.5">
          <span [class]="'w-3 h-3 rounded-sm ' + entry.style.base"></span>
          <span>{{ entry.style.label }}</span>
        </span>
      }
      <span class="inline-flex items-center gap-1.5 ml-2">
        <span class="w-3 h-3 rounded-sm bg-zinc-800 ring-1 ring-amber-400"></span>
        <span>Mine</span>
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-zinc-800 ring-1 ring-red-500"></span>
        <span>Other player</span>
      </span>
    </div>
  `,
})
export class WorldLegendComponent {
  protected readonly terrains = computed(() =>
    (Object.entries(TERRAIN_STYLES) as [Terrain, typeof TERRAIN_STYLES[Terrain]][]).map(([key, style]) => ({ key, style })),
  );
}
