import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { Router } from '@angular/router';
import { LucideAngularModule, RefreshCw, ExternalLink } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { TerritoryService } from '../../core/services/territory.service';
import { Terrain, Territory } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { WorldFiltersComponent } from './components/world-filters';
import { WorldGridComponent } from './components/world-grid';
import { WorldLegendComponent } from './components/world-legend';
import { TerritoryDetailPanelComponent } from './components/territory-detail-panel';
import { WORLD_PAGE_SIZE, WORLD_TOTAL, WorldFilter } from './world-utils';

@Component({
  selector: 'tt-world',
  imports: [
    WorldGridComponent,
    WorldFiltersComponent,
    WorldLegendComponent,
    TerritoryDetailPanelComponent,
    CardComponent,
    SpinnerComponent,
    ButtonComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-7xl">
      <header class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold">World map</h2>
          <p class="text-sm text-zinc-400">
            {{ stats().mineCount }} yours · {{ stats().ownedCount }} owned · {{ stats().unownedCount }} unclaimed
          </p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      <tt-world-filters
        [filter]="filter()"
        [terrain]="terrain()"
        (filterChanged)="onFilter($event)"
        (terrainChanged)="onTerrain($event)" />

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <tt-card padding="sm">
          @if (resource.isLoading() && tiles().length === 0) {
            <div class="flex flex-col items-center gap-2 py-12 text-zinc-400">
              <tt-spinner size="lg" />
              <p class="text-xs">Loading 2,500 tiles…</p>
            </div>
          } @else if (resource.error()) {
            <p class="text-sm text-red-300">Failed to load world. Try refreshing.</p>
          } @else {
            <tt-world-grid
              [tiles]="tiles()"
              [size]="50"
              [selectedId]="selected()?.id ?? null"
              [currentUserId]="user()?.id ?? null"
              [filter]="filter()"
              [terrain]="terrain()"
              (tileSelected)="onSelect($event)" />
            <div class="mt-3">
              <tt-world-legend />
            </div>
          }
        </tt-card>

        <tt-territory-detail-panel
          [tile]="selected()"
          [currentUserId]="user()?.id ?? null">
          @if (selected(); as s) {
            <tt-button size="sm" [fullWidth]="true" (clicked)="openDetail(s)">
              <lucide-angular [img]="ExternalLink" [size]="14" />
              Open territory
            </tt-button>
          }
        </tt-territory-detail-panel>
      </div>
    </div>
  `,
})
export default class WorldComponent {
  private readonly territoryService = inject(TerritoryService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected readonly filter = signal<WorldFilter>('all');
  protected readonly terrain = signal<Terrain | null>(null);
  protected readonly selected = signal<Territory | null>(null);

  protected readonly RefreshCw = RefreshCw;
  protected readonly ExternalLink = ExternalLink;

  protected openDetail(tile: Territory): void {
    void this.router.navigate(['/world', tile.id]);
  }

  protected readonly resource = rxResource({
    stream: () => {
      const requests = [];
      for (let offset = 0; offset < WORLD_TOTAL; offset += WORLD_PAGE_SIZE) {
        requests.push(this.territoryService.listWorld({ limit: WORLD_PAGE_SIZE, offset }));
      }
      return forkJoin(requests).pipe(
        map((pages) => pages.flatMap((p) => p.items)),
      );
    },
    defaultValue: [] as Territory[],
  });

  protected readonly tiles = computed<Territory[]>(() => this.resource.value() ?? []);

  protected readonly stats = computed(() => {
    const me = this.user()?.id ?? null;
    let mineCount = 0;
    let ownedCount = 0;
    let unownedCount = 0;
    for (const t of this.tiles()) {
      if (!t.owner_id) unownedCount += 1;
      else if (t.owner_id === me) mineCount += 1;
      else ownedCount += 1;
    }
    return { mineCount, ownedCount, unownedCount };
  });

  protected onFilter(filter: WorldFilter): void {
    this.filter.set(filter);
  }

  protected onTerrain(terrain: Terrain | null): void {
    this.terrain.set(terrain);
  }

  protected onSelect(tile: Territory): void {
    this.selected.set(tile);
  }

  protected reload(): void {
    this.resource.reload();
    this.selected.set(null);
  }
}
