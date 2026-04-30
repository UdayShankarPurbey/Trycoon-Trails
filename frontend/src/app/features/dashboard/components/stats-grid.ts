import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Building2, Map, Swords, Trophy } from 'lucide-angular';
import { forkJoin, map, of } from 'rxjs';
import { ArmyService } from '../../../core/services/army.service';
import { BattleService } from '../../../core/services/battle.service';
import { BusinessService } from '../../../core/services/business.service';
import { TerritoryService } from '../../../core/services/territory.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatTileComponent } from '../../../shared/ui/stat-tile/stat-tile';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'tt-stats-grid',
  imports: [StatTileComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (data.isLoading()) {
      <div class="flex justify-center py-6"><tt-spinner /></div>
    } @else if (data.value(); as d) {
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <tt-stat-tile
          label="Territories"
          [value]="d.territories"
          [icon]="Map"
          accent="bg-emerald-500/15 text-emerald-300" />
        <tt-stat-tile
          label="Businesses"
          [value]="d.businesses"
          [sublabel]="d.businessIncome + ' / min'"
          [icon]="Building2"
          accent="bg-amber-500/15 text-amber-300" />
        <tt-stat-tile
          label="Army strength"
          [value]="d.armyAttack"
          [sublabel]="'def ' + d.armyDefense"
          [icon]="Swords"
          accent="bg-rose-500/15 text-rose-300" />
        <tt-stat-tile
          label="Battles won"
          [value]="d.battlesWon"
          [sublabel]="d.battlesTotal + ' fought'"
          [icon]="Trophy"
          accent="bg-violet-500/15 text-violet-300" />
      </div>
    }
  `,
})
export class StatsGridComponent {
  private readonly territoryService = inject(TerritoryService);
  private readonly businessService = inject(BusinessService);
  private readonly armyService = inject(ArmyService);
  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);

  protected readonly Map = Map;
  protected readonly Building2 = Building2;
  protected readonly Swords = Swords;
  protected readonly Trophy = Trophy;

  protected readonly data = rxResource({
    stream: () => {
      const me = this.auth.user();
      return forkJoin({
        territories: this.territoryService.myTerritories(),
        businesses: this.businessService.listMine(),
        army: this.armyService.myArmy(),
        battles: this.battleService.myBattles({ limit: 200, offset: 0 }),
      }).pipe(
        map((res) => {
          const wins = me
            ? res.battles.items.filter((b) => b.winner_id === me.id).length
            : 0;
          const businessIncome = res.businesses.items.reduce(
            (sum, b) => sum + (b.income.per_minute || 0),
            0,
          );
          return {
            territories: res.territories.count,
            businesses: res.businesses.count,
            businessIncome,
            armyAttack: res.army.strength.attack,
            armyDefense: res.army.strength.defense,
            battlesWon: wins,
            battlesTotal: res.battles.total,
          };
        }),
      );
    },
    defaultValue: undefined,
  });
}
