import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideAngularModule, Swords, AlertTriangle, CheckCircle2 } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { ArmyService } from '../../../core/services/army.service';
import { AuthService } from '../../../core/services/auth.service';
import { BattleService } from '../../../core/services/battle.service';
import { ToastService } from '../../../core/services/toast.service';
import { ArmyGroup, AttackResult, MyArmySummary } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';

interface AttackDialogData {
  territoryId: string;
  defenderName: string;
  x: number;
  y: number;
}

@Component({
  selector: 'tt-attack-dialog',
  imports: [
    DialogShellComponent, ButtonComponent, BadgeComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Attack ' + data.defenderName">
      @if (step() === 'select') {
        @if (army(); as a) {
          @if (a.items.length === 0) {
            <p class="text-sm text-zinc-400">You have no army units. Recruit some first.</p>
          } @else {
            <p class="text-xs text-zinc-400 mb-3">
              Select how many of each unit to send. Units stay assigned to their home territory until they return.
            </p>
            <ul class="space-y-2">
              @for (g of a.items; track g.id) {
                <li class="flex items-center justify-between gap-3 p-2.5 rounded-md border border-zinc-800">
                  <div class="min-w-0">
                    <p class="text-sm font-medium">{{ g.unit_type.name }}</p>
                    <p class="text-[11px] text-zinc-500">
                      atk {{ g.unit_type.attack }} · def {{ g.unit_type.defense }} · @ ({{ g.territory.x }},{{ g.territory.y }})
                    </p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-xs text-zinc-500 tabular-nums">/ {{ g.count }}</span>
                    <input
                      type="number"
                      min="0"
                      [max]="g.count"
                      [value]="counts()[g.id] ?? 0"
                      (input)="setCount(g.id, $event)"
                      class="w-16 h-8 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </li>
              }
            </ul>
            <div class="mt-4 p-3 rounded-md bg-zinc-950 border border-zinc-800">
              <p class="text-sm">
                Total attackers:
                <span class="font-semibold tabular-nums">{{ totalSelected() }}</span>
                <span class="text-zinc-500">/ attack {{ totalAttackPower() }}</span>
              </p>
            </div>
          }
        } @else {
          <div class="flex justify-center py-6"><tt-spinner /></div>
        }
      } @else if (step() === 'result' && result(); as r) {
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            @if (r.attackerWon) {
              <lucide-angular [img]="CheckCircle2" [size]="20" class="text-emerald-300" />
              <h4 class="text-base font-semibold text-emerald-300">
                {{ r.captured ? 'Victory! Territory captured.' : 'Victory! (Capture requires L8)' }}
              </h4>
            } @else {
              <lucide-angular [img]="AlertTriangle" [size]="20" class="text-red-300" />
              <h4 class="text-base font-semibold text-red-300">Defeated</h4>
            }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div class="rounded-md border border-zinc-800 p-3">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Attacker</p>
              <p>Strength: <span class="tabular-nums">{{ r.attacker.strength }}</span></p>
              <p class="mt-1 text-[11px]">
                Lost: {{ totalLosses(r.attacker.losses) }} units
              </p>
            </div>
            <div class="rounded-md border border-zinc-800 p-3">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Defender</p>
              <p>
                Strength: <span class="tabular-nums">{{ r.defender.strength }}</span>
                <span class="text-zinc-500 text-[11px]"> (+{{ r.defender.territoryBonus }} terrain, +{{ r.defender.reputationBonus }} rep)</span>
              </p>
              <p class="mt-1 text-[11px]">
                Lost: {{ totalLosses(r.defender.losses) }} units
              </p>
            </div>
          </div>
          <div class="rounded-md border border-zinc-800 p-3 text-sm">
            <p>
              <tt-badge [variant]="r.reputationChange.attacker > 0 ? 'success' : 'danger'">
                rep {{ r.reputationChange.attacker > 0 ? '+' : '' }}{{ r.reputationChange.attacker }}
              </tt-badge>
            </p>
          </div>
        </div>
      }

      <ng-container dialog-footer>
        @if (step() === 'select') {
          <tt-button variant="ghost" size="sm" (clicked)="close()">Cancel</tt-button>
          <tt-button
            variant="danger"
            size="sm"
            [disabled]="totalSelected() === 0"
            [loading]="loading()"
            (clicked)="submit()">
            <lucide-angular [img]="Swords" [size]="14" />
            Attack
          </tt-button>
        } @else if (step() === 'result') {
          <tt-button size="sm" (clicked)="close()">Done</tt-button>
        }
      </ng-container>
    </tt-dialog-shell>
  `,
})
export class AttackDialogComponent {
  protected readonly data = inject<AttackDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<AttackResult | null>);
  private readonly armyService = inject(ArmyService);
  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly step = signal<'select' | 'result'>('select');
  protected readonly loading = signal(false);
  protected readonly army = signal<MyArmySummary | null>(null);
  protected readonly counts = signal<Record<string, number>>({});
  protected readonly result = signal<AttackResult | null>(null);

  protected readonly Swords = Swords;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly CheckCircle2 = CheckCircle2;

  protected readonly totalSelected = computed(() =>
    Object.values(this.counts()).reduce((s, n) => s + n, 0),
  );

  protected readonly totalAttackPower = computed(() => {
    const a = this.army();
    if (!a) return 0;
    return a.items.reduce((sum, g) => sum + (this.counts()[g.id] ?? 0) * g.unit_type.attack, 0);
  });

  constructor() {
    this.armyService.myArmy().subscribe({
      next: (res) => this.army.set(res),
      error: () => this.army.set({ manpower: { current: 0, cap: 0 }, strength: { attack: 0, defense: 0, groups: 0 }, groups: 0, items: [] }),
    });
  }

  protected setCount(armyId: string, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const a = this.army();
    if (!a) return;
    const group = a.items.find((g) => g.id === armyId) as ArmyGroup | undefined;
    const max = group?.count ?? 0;
    const n = Math.max(0, Math.min(max, parseInt(input.value, 10) || 0));
    this.counts.update((c) => ({ ...c, [armyId]: n }));
  }

  protected totalLosses(losses: { count: number }[]): number {
    return losses.reduce((s, l) => s + l.count, 0);
  }

  protected submit(): void {
    if (this.loading() || this.totalSelected() === 0) return;
    const units = Object.entries(this.counts())
      .filter(([, n]) => n > 0)
      .map(([army_id, count]) => ({ army_id, count }));
    this.loading.set(true);
    this.battleService.attack(this.data.territoryId, units).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.result.set(res);
        this.step.set('result');
        const u = this.auth.user();
        if (u) {
          this.auth.setUser({
            ...u,
            coins: res.balances.coins,
            reputation: res.balances.reputation,
            xp: res.balances.xp,
            level: res.balances.level,
          });
        }
        this.toast[res.attackerWon ? 'success' : 'warning'](
          res.attackerWon ? (res.captured ? 'Captured!' : 'Victory') : 'Defeated',
        );
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Attack failed', err.message);
      },
    });
  }

  protected close(): void {
    this.dialogRef.close(this.result());
  }
}
