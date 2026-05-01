import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Eye, Swords } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ArmyService } from '../../core/services/army.service';
import { BusinessService } from '../../core/services/business.service';
import { TerritoryService } from '../../core/services/territory.service';
import { ArmyGroup, MyBusiness, Territory } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { TerritoryDetailPanelComponent } from './components/territory-detail-panel';
import { TerritoryBusinessesListComponent } from './components/territory-businesses-list';
import { TerritoryArmiesListComponent } from './components/territory-armies-list';
import { ScoutDialogComponent } from './dialogs/scout-dialog';
import { AttackDialogComponent } from './dialogs/attack-dialog';
import { BuyBusinessDialogComponent } from './dialogs/buy-business-dialog';
import { RecruitDialogComponent } from './dialogs/recruit-dialog';
import { ownershipOf } from './world-utils';

@Component({
  selector: 'tt-territory-detail',
  imports: [
    RouterLink, LucideAngularModule, ButtonComponent, CardComponent, SpinnerComponent,
    TerritoryDetailPanelComponent, TerritoryBusinessesListComponent, TerritoryArmiesListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-5xl">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <a
          routerLink="/world"
          class="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100">
          <lucide-angular [img]="ArrowLeft" [size]="14" />
          Back to world map
        </a>
        @if (data.value(); as d) {
          @if (own() === 'other') {
            <div class="flex items-center gap-2">
              @if ((user()?.level ?? 0) >= 6) {
                <tt-button variant="secondary" size="sm" (clicked)="openScout(d.tile)">
                  <lucide-angular [img]="Eye" [size]="14" />
                  Scout (50c)
                </tt-button>
              }
              @if ((user()?.level ?? 0) >= 7) {
                <tt-button variant="danger" size="sm" (clicked)="openAttack(d.tile)">
                  <lucide-angular [img]="Swords" [size]="14" />
                  Attack
                </tt-button>
              }
            </div>
          }
        }
      </header>

      @if (data.isLoading()) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (data.error()) {
        <tt-card>
          <p class="text-sm text-red-300">Failed to load territory.</p>
        </tt-card>
      } @else if (data.value(); as d) {
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <div class="space-y-4 min-w-0">
            <tt-territory-businesses-list
              [businesses]="d.businesses"
              [capacity]="d.tile.business_capacity"
              [canManage]="own() === 'mine'"
              (buyClicked)="openBuy(d.tile, d.businesses.length)"
              (changed)="reload()" />
            <tt-territory-armies-list
              [armies]="d.armies"
              [canManage]="own() === 'mine'"
              (recruitClicked)="openRecruit(d.tile)"
              (changed)="reload()" />
          </div>
          <tt-territory-detail-panel
            [tile]="d.tile"
            [currentUserId]="user()?.id ?? null" />
        </div>
      }
    </div>
  `,
})
export default class TerritoryDetailComponent {
  readonly id = input.required<string>();

  private readonly territoryService = inject(TerritoryService);
  private readonly businessService = inject(BusinessService);
  private readonly armyService = inject(ArmyService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected readonly ArrowLeft = ArrowLeft;
  protected readonly Eye = Eye;
  protected readonly Swords = Swords;

  protected readonly data = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      forkJoin({
        tile: this.territoryService.byId(id),
        myBusinesses: this.businessService.listMine().pipe(catchError(() => of({ count: 0, items: [] }))),
        myArmy: this.armyService.myArmy().pipe(catchError(() => of({
          manpower: { current: 0, cap: 0 },
          strength: { attack: 0, defense: 0, groups: 0 },
          groups: 0,
          items: [] as ArmyGroup[],
        }))),
      }).pipe(
        map(({ tile, myBusinesses, myArmy }) => ({
          tile,
          businesses: myBusinesses.items.filter((b: MyBusiness) => b.territory.id === tile.id),
          armies: myArmy.items.filter((a: ArmyGroup) => a.territory.id === tile.id),
        })),
      ),
  });

  protected readonly own = computed(() => {
    const tile = this.data.value()?.tile;
    if (!tile) return 'unowned' as const;
    return ownershipOf(tile, this.user()?.id ?? null);
  });

  protected reload(): void {
    this.data.reload();
  }

  protected openScout(tile: Territory): void {
    const ref = this.dialog.open(ScoutDialogComponent, {
      data: { territoryId: tile.id, x: tile.x, y: tile.y },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe(() => this.reload());
  }

  protected openAttack(tile: Territory): void {
    const ref = this.dialog.open(AttackDialogComponent, {
      data: { territoryId: tile.id, defenderName: tile.owner?.username ?? 'unowned', x: tile.x, y: tile.y },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((result) => {
      if (result) {
        this.reload();
        if ((result as { captured?: boolean }).captured) {
          void this.router.navigate(['/world', tile.id]);
        }
      }
    });
  }

  protected openBuy(tile: Territory, currentCount: number): void {
    const ref = this.dialog.open(BuyBusinessDialogComponent, {
      data: {
        territoryId: tile.id,
        x: tile.x,
        y: tile.y,
        openSlots: tile.business_capacity - currentCount,
        capacity: tile.business_capacity,
      },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((bought) => { if (bought) this.reload(); });
  }

  protected openRecruit(tile: Territory): void {
    const ref = this.dialog.open(RecruitDialogComponent, {
      data: { territoryId: tile.id, x: tile.x, y: tile.y },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((recruited) => { if (recruited) this.reload(); });
  }
}
