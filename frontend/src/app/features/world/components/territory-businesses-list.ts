import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, Building2 } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
import { ToastService } from '../../../core/services/toast.service';
import { MyBusiness } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { BusinessRowAction, BusinessRowComponent } from '../../businesses/components/business-row';

@Component({
  selector: 'tt-territory-businesses-list',
  imports: [
    CardComponent, EmptyStateComponent, ButtonComponent, LucideAngularModule,
    BusinessRowComponent,
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
            <tt-business-row
              [business]="b"
              [canManage]="canManage()"
              [loadingAction]="loadingFor(b.id)"
              (actionTriggered)="onAction(b, $event)" />
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

  protected readonly actingId = signal<string | null>(null);
  protected readonly actingKind = signal<BusinessRowAction | null>(null);

  protected readonly capacityLabel = computed(
    () => `${this.businesses().length}/${this.capacity()} slots used`,
  );

  protected full(): boolean {
    return this.businesses().length >= this.capacity();
  }

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
          const r = res as { balances: { coins: number } };
          this.auth.setUser({ ...u, coins: r.balances.coins });
          this.toast.success('Collected', `+${(r as unknown as { earned: number }).earned} coins`);
        } else if (u && action === 'upgrade') {
          this.auth.setUser({ ...u, coins: Number(u.coins) - Number(b.upgrade_cost) });
          this.toast.success(`${b.type.name} upgraded`, `Now level ${b.level + 1}`);
        }
        this.changed.emit();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.actingKind.set(null);
        this.toast.error(action === 'collect' ? 'Collect failed' : 'Upgrade failed', err.message);
      },
    });
  }
}
