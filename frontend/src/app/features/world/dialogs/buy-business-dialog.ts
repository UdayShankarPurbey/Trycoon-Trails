import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Lock, Coins } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessService } from '../../../core/services/business.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessType } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

@Component({
  selector: 'tt-buy-business-dialog',
  imports: [
    DialogShellComponent, ButtonComponent, BadgeComponent, SpinnerComponent,
    LucideAngularModule, FormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Buy a business at (' + data.x + ',' + data.y + ')'">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else {
        <p class="text-xs text-zinc-400 mb-3">
          Open slots: {{ data.openSlots }} of {{ data.capacity }}. Your coins:
          <span class="text-amber-300 font-medium">{{ user()?.coins | ttFormatNumber }}</span>.
        </p>
        <ul class="space-y-2">
          @for (t of resource.value()?.types; track t.id) {
            <li
              [class]="optionClass(t)"
              (click)="select(t)">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ t.name }}</p>
                  @if (!canAfford(t)) {
                    <tt-badge variant="danger">need {{ t.base_cost - (user()?.coins ?? 0) | ttFormatNumber }}c</tt-badge>
                  }
                  @if (!unlocked(t)) {
                    <tt-badge variant="warning">
                      <lucide-angular [img]="Lock" [size]="10" />
                      L{{ t.unlock_level }}
                    </tt-badge>
                  }
                </div>
                <p class="text-[11px] text-zinc-500">{{ t.description }}</p>
              </div>
              <div class="text-right shrink-0 ml-3">
                <p class="text-sm tabular-nums inline-flex items-center gap-1 text-amber-300">
                  <lucide-angular [img]="Coins" [size]="12" />
                  {{ t.base_cost | ttFormatNumber }}
                </p>
                <p class="text-[11px] text-zinc-500">+{{ t.base_income_per_min }}/min</p>
              </div>
            </li>
          }
        </ul>
      }
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button
          size="sm"
          [disabled]="!selected() || !canAfford(selected()!) || !unlocked(selected()!)"
          [loading]="buying()"
          (clicked)="buy()">
          Buy
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class BuyBusinessDialogComponent {
  protected readonly data = inject<{
    territoryId: string;
    x: number;
    y: number;
    openSlots: number;
    capacity: number;
  }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly businessService = inject(BusinessService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;
  protected readonly resource = rxResource({ stream: () => this.businessService.listTypes() });
  protected readonly selected = signal<BusinessType | null>(null);
  protected readonly buying = signal(false);

  protected readonly Lock = Lock;
  protected readonly Coins = Coins;

  protected canAfford(t: BusinessType): boolean {
    return Number(this.user()?.coins ?? 0) >= Number(t.base_cost);
  }

  protected unlocked(t: BusinessType): boolean {
    return (this.user()?.level ?? 0) >= t.unlock_level;
  }

  protected select(t: BusinessType): void {
    this.selected.set(t);
  }

  protected optionClass(t: BusinessType): string {
    const isSelected = this.selected()?.id === t.id;
    const ok = this.canAfford(t) && this.unlocked(t);
    return [
      'flex items-center justify-between gap-3 p-3 rounded-md border cursor-pointer transition',
      isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 hover:border-zinc-700',
      !ok ? 'opacity-60' : '',
    ].join(' ');
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected buy(): void {
    const t = this.selected();
    if (!t || this.buying()) return;
    this.buying.set(true);
    this.businessService.buy({ territory_id: this.data.territoryId, type_code: t.code }).subscribe({
      next: () => {
        const u = this.auth.user();
        if (u) {
          this.auth.setUser({ ...u, coins: Number(u.coins) - Number(t.base_cost) });
        }
        this.toast.success(`Bought ${t.name}`, `-${t.base_cost} coins`);
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.buying.set(false);
        this.toast.error('Purchase failed', err.message);
      },
    });
  }
}
