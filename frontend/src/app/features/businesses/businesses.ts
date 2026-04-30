import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Building2, RefreshCw } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { TerritoryService } from '../../core/services/territory.service';
import { ToastService } from '../../core/services/toast.service';
import { MyBusiness, Territory } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { BuyBusinessDialogComponent } from '../world/dialogs/buy-business-dialog';
import { BusinessRowAction, BusinessRowComponent } from './components/business-row';
import { BusinessAggregate, BusinessesStatsComponent } from './components/businesses-stats';
import { TerritorySlots, TerritorySlotsCardComponent } from './components/territory-slots-card';

@Component({
  selector: 'tt-businesses',
  imports: [
    BusinessRowComponent,
    BusinessesStatsComponent,
    TerritorySlotsCardComponent,
    CardComponent,
    EmptyStateComponent,
    SpinnerComponent,
    ButtonComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-6xl">
      <header class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Businesses</h2>
          <p class="text-sm text-zinc-400">All your businesses across every territory.</p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="data.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      @if (data.isLoading() && businesses().length === 0) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (data.error()) {
        <tt-card>
          <p class="text-sm text-red-300">Failed to load businesses.</p>
        </tt-card>
      } @else {
        <tt-businesses-stats
          [agg]="aggregate()"
          [collecting]="collectingAll()"
          (collectAllClicked)="collectAll()" />

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <tt-card title="All businesses" [subtitle]="businesses().length + ' total'">
            @if (businesses().length === 0) {
              <tt-empty-state
                [icon]="Building2"
                title="No businesses yet"
                description="Buy your first business by clicking + next to a territory." />
            } @else {
              <ul class="space-y-2">
                @for (b of businesses(); track b.id) {
                  <tt-business-row
                    [business]="b"
                    [canManage]="true"
                    [showTerritory]="true"
                    [loadingAction]="loadingFor(b.id)"
                    (actionTriggered)="onAction(b, $event)" />
                }
              </ul>
            }
          </tt-card>

          <tt-territory-slots-card
            [slots]="territorySlots()"
            (buyOnTerritory)="openBuyOnTerritory($event)" />
        </div>
      }
    </div>
  `,
})
export default class BusinessesComponent {
  private readonly businessService = inject(BusinessService);
  private readonly territoryService = inject(TerritoryService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Building2 = Building2;
  protected readonly RefreshCw = RefreshCw;

  protected readonly actingId = signal<string | null>(null);
  protected readonly actingKind = signal<BusinessRowAction | null>(null);
  protected readonly collectingAll = signal(false);

  protected readonly data = rxResource({
    stream: () =>
      forkJoin({
        businesses: this.businessService.listMine(),
        territories: this.territoryService.myTerritories(),
      }),
  });

  protected readonly businesses = computed<MyBusiness[]>(
    () => this.data.value()?.businesses.items ?? [],
  );

  protected readonly territories = computed<Territory[]>(
    () => this.data.value()?.territories.items ?? [],
  );

  protected readonly aggregate = computed<BusinessAggregate>(() => {
    const list = this.businesses();
    return {
      count: list.length,
      perMinute: list.reduce((s, b) => s + b.income.per_minute, 0),
      uncollected: list.reduce((s, b) => s + b.income.uncollected, 0),
      totalUpgradeCost: list.reduce((s, b) => s + Number(b.upgrade_cost), 0),
    };
  });

  protected readonly territorySlots = computed<TerritorySlots[]>(() => {
    const counts = new Map<string, number>();
    for (const b of this.businesses()) {
      counts.set(b.territory.id, (counts.get(b.territory.id) ?? 0) + 1);
    }
    return this.territories().map((t) => ({
      territory: t,
      used: counts.get(t.id) ?? 0,
      capacity: t.business_capacity,
    }));
  });

  protected loadingFor(id: string): BusinessRowAction | null {
    return this.actingId() === id ? this.actingKind() : null;
  }

  protected onAction(b: MyBusiness, action: BusinessRowAction): void {
    if (this.actingId()) return;
    this.actingId.set(b.id);
    this.actingKind.set(action);
    const obs = action === 'collect'
      ? this.businessService.collect(b.id)
      : this.businessService.upgrade(b.id);
    obs.subscribe({
      next: (res) => {
        this.actingId.set(null);
        this.actingKind.set(null);
        const u = this.auth.user();
        if (u && action === 'collect') {
          const r = res as { earned: number; balances: { coins: number } };
          this.auth.setUser({ ...u, coins: r.balances.coins });
          this.toast.success('Collected', `+${r.earned} coins`);
        } else if (u && action === 'upgrade') {
          this.auth.setUser({ ...u, coins: Number(u.coins) - Number(b.upgrade_cost) });
          this.toast.success(`${b.type.name} upgraded`, `Now level ${b.level + 1}`);
        }
        this.data.reload();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.actingKind.set(null);
        this.toast.error(action === 'collect' ? 'Collect failed' : 'Upgrade failed', err.message);
      },
    });
  }

  protected collectAll(): void {
    if (this.collectingAll()) return;
    this.collectingAll.set(true);
    this.businessService.collectAll().subscribe({
      next: (res) => {
        this.collectingAll.set(false);
        const u = this.auth.user();
        if (u) this.auth.setUser({ ...u, coins: res.balances.coins });
        this.toast.success('Collected from all', `+${res.earned} coins`);
        this.data.reload();
      },
      error: (err: ApiError) => {
        this.collectingAll.set(false);
        this.toast.error('Collect-all failed', err.message);
      },
    });
  }

  protected openBuyOnTerritory(slot: TerritorySlots): void {
    const ref = this.dialog.open(BuyBusinessDialogComponent, {
      data: {
        territoryId: slot.territory.id,
        x: slot.territory.x,
        y: slot.territory.y,
        openSlots: slot.capacity - slot.used,
        capacity: slot.capacity,
      },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((bought) => { if (bought) this.data.reload(); });
  }

  protected reload(): void {
    this.data.reload();
  }
}
