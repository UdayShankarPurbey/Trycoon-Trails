import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, Sword, Shield, Users, Coins } from 'lucide-angular';
import { CardComponent } from '../../../shared/ui/card/card';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar';
import { StatTileComponent } from '../../../shared/ui/stat-tile/stat-tile';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

export interface ArmyAggregate {
  totalAttack: number;
  totalDefense: number;
  totalUnits: number;
  upkeepPerMin: number;
  manpowerCurrent: number;
  manpowerCap: number;
  groups: number;
}

@Component({
  selector: 'tt-army-stats',
  imports: [
    CardComponent, ProgressBarComponent, StatTileComponent,
    LucideAngularModule, FormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <tt-card>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold inline-flex items-center gap-2 text-rose-300">
            <lucide-angular [img]="Users" [size]="16" />
            Manpower
          </h3>
          <span class="text-xs text-zinc-400 tabular-nums">
            {{ agg().manpowerCurrent | ttFormatNumber }} / {{ agg().manpowerCap | ttFormatNumber }}
          </span>
        </div>
        <tt-progress-bar [value]="agg().manpowerCurrent" [max]="agg().manpowerCap" />
        <p class="text-[11px] text-zinc-500 mt-1.5">
          Regenerates +10/hour. Cap scales with your level.
        </p>
      </tt-card>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <tt-stat-tile
          label="Total units"
          [value]="agg().totalUnits"
          [icon]="Users"
          accent="bg-zinc-700/40 text-zinc-200" />
        <tt-stat-tile
          label="Attack"
          [value]="agg().totalAttack"
          [icon]="Sword"
          accent="bg-rose-500/15 text-rose-300" />
        <tt-stat-tile
          label="Defense"
          [value]="agg().totalDefense"
          [icon]="Shield"
          accent="bg-emerald-500/15 text-emerald-300" />
        <tt-stat-tile
          label="Upkeep"
          [value]="agg().upkeepPerMin"
          [sublabel]="'coins / min'"
          [icon]="Coins"
          accent="bg-amber-500/15 text-amber-300" />
      </div>
    </div>
  `,
})
export class ArmyStatsComponent {
  readonly agg = input.required<ArmyAggregate>();

  protected readonly Sword = Sword;
  protected readonly Shield = Shield;
  protected readonly Users = Users;
  protected readonly Coins = Coins;
}
