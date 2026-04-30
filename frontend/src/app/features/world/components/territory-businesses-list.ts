import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, Building2, ArrowUpRight, Coins } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
import { ToastService } from '../../../core/services/toast.service';
import { MyBusiness } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

@Component({
  selector: 'tt-territory-businesses-list',
  imports: [
    CardComponent, EmptyStateComponent, BadgeComponent, ButtonComponent,
    LucideAngularModule, FormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Businesses on this tile" [subtitle]="capacityLabel()">
      <div card-actions>
        @if (canManage()) {
          <tt-button size="sm" [disabled]="full()" (clicked)="buyClicked.emit()">
            <lucide-angular [img]="Building2" [size]="14" />
            Buy business
          </tt-button>
        }
      </div>
      @if (businesses().length === 0) {
        <tt-empty-state [icon]="Building2" title="No businesses yet" />
      } @else {
        <ul class="space-y-2">
          @for (b of businesses(); track b.id) {
            <li class="flex items-center justify-between gap-3 p-2.5 rounded-md border border-zinc-800">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ b.type.name }}</p>
                  <tt-badge variant="default">L{{ b.level }}/{{ b.type.max_level }}</tt-badge>
                </div>
                <p class="text-[11px] text-zinc-500">
                  +{{ b.income.per_minute | ttFormatNumber }}/min · uncollected
                  <span class="text-amber-300">{{ b.income.uncollected | ttFormatNumber }}c</span>
                </p>
              </div>
              @if (canManage()) {
                <div class="flex items-center gap-1.5 shrink-0">
                  <tt-button size="sm" variant="ghost" [loading]="actingId() === 'collect:' + b.id" (clicked)="collect(b)">
                    <lucide-angular [img]="Coins" [size]="14" />
                    Collect
                  </tt-button>
                  <tt-button
                    size="sm"
                    variant="secondary"
                    [disabled]="b.level >= b.type.max_level"
                    [loading]="actingId() === 'upgrade:' + b.id"
                    (clicked)="upgrade(b)">
                    <lucide-angular [img]="ArrowUpRight" [size]="14" />
                    {{ b.upgrade_cost | ttFormatNumber }}c
                  </tt-button>
                </div>
              }
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class TerritoryBusinessesListComponent {
  private readonly businessService = inject(BusinessService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly businesses = input.required<MyBusiness[]>();
  readonly capacity = input.required<number>();
  readonly canManage = input<boolean>(false);

  readonly buyClicked = output<void>();
  readonly changed = output<void>();

  protected readonly Building2 = Building2;
  protected readonly ArrowUpRight = ArrowUpRight;
  protected readonly Coins = Coins;

  protected readonly actingId = signal<string | null>(null);

  protected readonly capacityLabel = computed(
    () => `${this.businesses().length}/${this.capacity()} slots used`,
  );

  protected full(): boolean {
    return this.businesses().length >= this.capacity();
  }

  protected collect(b: MyBusiness): void {
    if (this.actingId()) return;
    this.actingId.set(`collect:${b.id}`);
    this.businessService.collect(b.id).subscribe({
      next: (res) => {
        this.actingId.set(null);
        const u = this.auth.user();
        if (u) this.auth.setUser({ ...u, coins: res.balances.coins });
        this.toast.success('Collected', `+${res.earned} coins`);
        this.changed.emit();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.toast.error('Collect failed', err.message);
      },
    });
  }

  protected upgrade(b: MyBusiness): void {
    if (this.actingId()) return;
    this.actingId.set(`upgrade:${b.id}`);
    this.businessService.upgrade(b.id).subscribe({
      next: () => {
        this.actingId.set(null);
        const u = this.auth.user();
        if (u) this.auth.setUser({ ...u, coins: Number(u.coins) - Number(b.upgrade_cost) });
        this.toast.success(`${b.type.name} upgraded`, `Now level ${b.level + 1}`);
        this.changed.emit();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.toast.error('Upgrade failed', err.message);
      },
    });
  }
}
