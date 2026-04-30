import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Lock, Coins, Users } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { ArmyService } from '../../../core/services/army.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UnitType } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

@Component({
  selector: 'tt-recruit-dialog',
  imports: [
    DialogShellComponent, ButtonComponent, BadgeComponent, SpinnerComponent,
    LucideAngularModule, FormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Recruit at (' + data.x + ',' + data.y + ')'">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else {
        <p class="text-xs text-zinc-400 mb-3">
          Coins: <span class="text-amber-300 font-medium">{{ user()?.coins | ttFormatNumber }}</span>
          · Manpower: <span class="text-rose-300 font-medium">{{ user()?.manpower }}</span>
        </p>
        <ul class="space-y-2 mb-4">
          @for (u of resource.value()?.types; track u.id) {
            <li
              [class]="optionClass(u)"
              (click)="select(u)">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ u.name }}</p>
                  <tt-badge variant="default">{{ u.category }}</tt-badge>
                  @if (!unlocked(u)) {
                    <tt-badge variant="warning">
                      <lucide-angular [img]="Lock" [size]="10" />
                      L{{ u.unlock_level }}
                    </tt-badge>
                  }
                </div>
                <p class="text-[11px] text-zinc-500">
                  atk {{ u.attack }} · def {{ u.defense }} · upkeep {{ u.upkeep_per_min }}/min
                </p>
              </div>
              <div class="text-right shrink-0 ml-3 text-sm">
                <p class="inline-flex items-center gap-1 text-amber-300 tabular-nums">
                  <lucide-angular [img]="Coins" [size]="12" />
                  {{ u.coin_cost | ttFormatNumber }}
                </p>
                <p class="inline-flex items-center gap-1 text-rose-300 tabular-nums">
                  <lucide-angular [img]="Users" [size]="12" />
                  {{ u.manpower_cost }}
                </p>
              </div>
            </li>
          }
        </ul>
        @if (selected()) {
          <div class="rounded-md border border-zinc-800 p-3">
            <label class="block text-xs text-zinc-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              [max]="maxAffordable()"
              [value]="count()"
              (input)="onCount($event)"
              class="w-28 h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <p class="text-[11px] text-zinc-500 mt-1">
              Total cost: {{ totalCoinCost() | ttFormatNumber }} coins +
              {{ totalManpowerCost() }} manpower (max affordable: {{ maxAffordable() }})
            </p>
          </div>
        }
      }
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button
          size="sm"
          [disabled]="!canRecruit()"
          [loading]="recruiting()"
          (clicked)="recruit()">
          Recruit
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class RecruitDialogComponent {
  protected readonly data = inject<{ territoryId: string; x: number; y: number }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly armyService = inject(ArmyService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;
  protected readonly resource = rxResource({ stream: () => this.armyService.listTypes() });
  protected readonly selected = signal<UnitType | null>(null);
  protected readonly count = signal<number>(1);
  protected readonly recruiting = signal(false);

  protected readonly Lock = Lock;
  protected readonly Coins = Coins;
  protected readonly Users = Users;

  protected unlocked(u: UnitType): boolean {
    return (this.user()?.level ?? 0) >= u.unlock_level;
  }

  protected select(u: UnitType): void {
    this.selected.set(u);
    this.count.set(1);
  }

  protected optionClass(u: UnitType): string {
    const isSelected = this.selected()?.id === u.id;
    const ok = this.unlocked(u);
    return [
      'flex items-center justify-between gap-3 p-3 rounded-md border cursor-pointer transition',
      isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 hover:border-zinc-700',
      !ok ? 'opacity-60' : '',
    ].join(' ');
  }

  protected onCount(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const n = Math.max(1, Math.min(this.maxAffordable(), parseInt(input.value, 10) || 1));
    this.count.set(n);
  }

  protected readonly totalCoinCost = computed(() => (this.selected()?.coin_cost ?? 0) * this.count());
  protected readonly totalManpowerCost = computed(() => (this.selected()?.manpower_cost ?? 0) * this.count());

  protected readonly maxAffordable = computed(() => {
    const u = this.selected();
    const me = this.user();
    if (!u || !me) return 1;
    const byCoins = Math.floor(Number(me.coins) / Number(u.coin_cost));
    const byMp = Math.floor(Number(me.manpower) / u.manpower_cost);
    return Math.min(byCoins, byMp, 1000);
  });

  protected canRecruit(): boolean {
    const u = this.selected();
    if (!u || !this.unlocked(u)) return false;
    return this.count() > 0 && this.count() <= this.maxAffordable();
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected recruit(): void {
    const u = this.selected();
    if (!u || !this.canRecruit() || this.recruiting()) return;
    this.recruiting.set(true);
    this.armyService.recruit({
      territory_id: this.data.territoryId,
      unit_code: u.code,
      count: this.count(),
    }).subscribe({
      next: () => {
        const me = this.auth.user();
        if (me) {
          this.auth.setUser({
            ...me,
            coins: Number(me.coins) - this.totalCoinCost(),
            manpower: Number(me.manpower) - this.totalManpowerCost(),
          });
        }
        this.toast.success(`Recruited ${this.count()} ${u.name}`);
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.recruiting.set(false);
        this.toast.error('Recruit failed', err.message);
      },
    });
  }
}
