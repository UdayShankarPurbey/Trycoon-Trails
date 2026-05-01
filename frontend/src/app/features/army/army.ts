import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, RefreshCw, Swords } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { ArmyService } from '../../core/services/army.service';
import { TerritoryService } from '../../core/services/territory.service';
import { ArmyGroup, Territory } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { RecruitDialogComponent } from '../world/dialogs/recruit-dialog';
import { ArmyAggregate, ArmyStatsComponent } from './components/army-stats';
import { ArmyRowComponent } from './components/army-row';
import { ArmyTerritoryEntry, ArmyTerritoriesCardComponent } from './components/army-territories-card';
import { DisbandDialogComponent } from './dialogs/disband-dialog';

@Component({
  selector: 'tt-army',
  imports: [
    ArmyStatsComponent,
    ArmyRowComponent,
    ArmyTerritoriesCardComponent,
    CardComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ButtonComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-6xl">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold">Army</h2>
          <p class="text-sm text-zinc-400">All units stationed across your territories.</p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="data.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      @if (data.isLoading() && armies().length === 0) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (data.error()) {
        <tt-card>
          <p class="text-sm text-red-300">Failed to load army.</p>
        </tt-card>
      } @else {
        <tt-army-stats [agg]="aggregate()" />

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <tt-card title="Units" [subtitle]="armies().length + ' groups'">
            @if (armies().length === 0) {
              <tt-empty-state
                [icon]="Swords"
                title="No units yet"
                description="Recruit units on a territory you own (Level 4+)." />
            } @else {
              <ul class="space-y-2">
                @for (a of armies(); track a.id) {
                  <tt-army-row
                    [army]="a"
                    [canManage]="true"
                    [showTerritory]="true"
                    [loadingDisband]="disbandingId() === a.id"
                    (disbandTriggered)="openDisband(a)" />
                }
              </ul>
            }
          </tt-card>

          <tt-army-territories-card
            [entries]="territoryEntries()"
            (recruitOn)="openRecruit($event)" />
        </div>
      }
    </div>
  `,
})
export default class ArmyComponent {
  private readonly armyService = inject(ArmyService);
  private readonly territoryService = inject(TerritoryService);
  private readonly dialog = inject(Dialog);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Swords = Swords;

  protected readonly disbandingId = signal<string | null>(null);

  protected readonly data = rxResource({
    stream: () =>
      forkJoin({
        army: this.armyService.myArmy(),
        territories: this.territoryService.myTerritories(),
      }),
  });

  protected readonly armies = computed<ArmyGroup[]>(() => this.data.value()?.army.items ?? []);
  protected readonly territories = computed<Territory[]>(
    () => this.data.value()?.territories.items ?? [],
  );

  protected readonly aggregate = computed<ArmyAggregate>(() => {
    const a = this.data.value()?.army;
    if (!a) {
      return {
        totalAttack: 0, totalDefense: 0, totalUnits: 0, upkeepPerMin: 0,
        manpowerCurrent: 0, manpowerCap: 100, groups: 0,
      };
    }
    const totalUnits = a.items.reduce((s, g) => s + g.count, 0);
    const upkeepPerMin = a.items.reduce((s, g) => s + g.upkeep_per_min_total, 0);
    return {
      totalAttack: a.strength.attack,
      totalDefense: a.strength.defense,
      totalUnits,
      upkeepPerMin,
      manpowerCurrent: a.manpower.current,
      manpowerCap: a.manpower.cap,
      groups: a.groups,
    };
  });

  protected readonly territoryEntries = computed<ArmyTerritoryEntry[]>(() => {
    const counts = new Map<string, number>();
    for (const a of this.armies()) {
      counts.set(a.territory.id, (counts.get(a.territory.id) ?? 0) + a.count);
    }
    return this.territories().map((t) => ({
      territory: t,
      unitCount: counts.get(t.id) ?? 0,
    }));
  });

  protected openDisband(army: ArmyGroup): void {
    if (this.disbandingId()) return;
    this.disbandingId.set(army.id);
    const ref = this.dialog.open(DisbandDialogComponent, {
      data: {
        armyId: army.id,
        unitName: army.unit_type.name,
        manpowerCost: army.unit_type.manpower_cost,
        currentCount: army.count,
      },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((disbanded) => {
      this.disbandingId.set(null);
      if (disbanded) this.data.reload();
    });
  }

  protected openRecruit(entry: ArmyTerritoryEntry): void {
    const ref = this.dialog.open(RecruitDialogComponent, {
      data: { territoryId: entry.territory.id, x: entry.territory.x, y: entry.territory.y },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((recruited) => { if (recruited) this.data.reload(); });
  }

  protected reload(): void {
    this.data.reload();
  }
}
