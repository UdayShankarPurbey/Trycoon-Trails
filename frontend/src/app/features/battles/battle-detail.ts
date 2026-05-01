import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, MapPin, Coins } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { BattleService } from '../../core/services/battle.service';
import { Battle, BattleLoss, BattleUnit } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { BattleResultCardComponent } from './components/battle-result-card';

interface SideRow {
  unit: BattleUnit;
  lost: number;
  remaining: number;
}

@Component({
  selector: 'tt-battle-detail',
  imports: [
    RouterLink, BattleResultCardComponent, CardComponent, BadgeComponent,
    SpinnerComponent, TimeAgoPipe, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-4xl">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <a
          routerLink="/battles"
          class="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100">
          <lucide-angular [img]="ArrowLeft" [size]="14" />
          Back to battles
        </a>
        @if (battle.value(); as b) {
          <span class="text-xs text-zinc-500">{{ b.createdAt | ttTimeAgo }}</span>
        }
      </header>

      @if (battle.isLoading()) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (battle.error()) {
        <tt-card>
          <p class="text-sm text-red-300">Failed to load battle.</p>
        </tt-card>
      } @else if (battle.value(); as b) {
        <tt-battle-result-card [battle]="b" [currentUserId]="user()?.id ?? null" />

        @if (b.territory; as t) {
          <tt-card>
            <p class="text-sm">
              <lucide-angular [img]="MapPin" [size]="14" class="inline text-zinc-400 mr-1.5" />
              <span class="text-zinc-300">Territory:</span>
              <span class="ml-1 text-zinc-100 font-medium">{{ t.name }}</span>
              <span class="ml-1 text-zinc-500">({{ t.x }},{{ t.y }})</span>
            </p>
          </tt-card>
        }

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tt-card title="Attacker" [subtitle]="'Strength ' + b.attacker_strength">
            <div card-actions>
              <tt-badge [variant]="repBadge(b.reputation_change.attacker)">
                rep {{ b.reputation_change.attacker > 0 ? '+' : '' }}{{ b.reputation_change.attacker }}
              </tt-badge>
            </div>
            <p class="text-sm text-zinc-300 mb-3">
              {{ b.attacker?.username ?? 'unknown' }}
              @if (b.attacker?.level) { <span class="text-zinc-500 text-xs ml-1">L{{ b.attacker?.level }}</span> }
            </p>
            @if (attackerRows().length === 0) {
              <p class="text-sm text-zinc-500">No units sent.</p>
            } @else {
              <ul class="space-y-1.5 text-sm">
                @for (r of attackerRows(); track r.unit.code) {
                  <li class="flex items-center justify-between gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <p class="font-medium">{{ r.unit.name }}</p>
                      <p class="text-[11px] text-zinc-500">atk {{ r.unit.attack }} · def {{ r.unit.defense }}</p>
                    </div>
                    <div class="text-right text-xs">
                      <p>sent <span class="tabular-nums text-zinc-200">{{ r.unit.count }}</span></p>
                      @if (r.lost > 0) {
                        <p class="text-rose-300 tabular-nums">-{{ r.lost }} lost</p>
                      } @else {
                        <p class="text-emerald-300">no losses</p>
                      }
                    </div>
                  </li>
                }
              </ul>
            }
          </tt-card>

          <tt-card title="Defender" [subtitle]="'Strength ' + b.defender_strength">
            <div card-actions>
              <tt-badge [variant]="repBadge(b.reputation_change.defender)">
                rep {{ b.reputation_change.defender > 0 ? '+' : '' }}{{ b.reputation_change.defender }}
              </tt-badge>
            </div>
            <p class="text-sm text-zinc-300 mb-3">
              {{ b.defender?.username ?? 'unowned' }}
              @if (b.defender?.level) { <span class="text-zinc-500 text-xs ml-1">L{{ b.defender?.level }}</span> }
            </p>
            @if (defenderRows().length === 0) {
              <p class="text-sm text-zinc-500">No defenders stationed.</p>
            } @else {
              <ul class="space-y-1.5 text-sm">
                @for (r of defenderRows(); track r.unit.code) {
                  <li class="flex items-center justify-between gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <p class="font-medium">{{ r.unit.name }}</p>
                      <p class="text-[11px] text-zinc-500">atk {{ r.unit.attack }} · def {{ r.unit.defense }}</p>
                    </div>
                    <div class="text-right text-xs">
                      <p>defended <span class="tabular-nums text-zinc-200">{{ r.unit.count }}</span></p>
                      @if (r.lost > 0) {
                        <p class="text-rose-300 tabular-nums">-{{ r.lost }} lost</p>
                      } @else {
                        <p class="text-emerald-300">no losses</p>
                      }
                    </div>
                  </li>
                }
              </ul>
            }
          </tt-card>
        </div>

        @if (b.notes) {
          <tt-card>
            <p class="text-xs text-zinc-400 italic">{{ b.notes }}</p>
          </tt-card>
        }
      }
    </div>
  `,
})
export default class BattleDetailComponent {
  readonly id = input.required<string>();

  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly MapPin = MapPin;
  protected readonly Coins = Coins;

  protected readonly battle = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.battleService.byId(id),
  });

  protected readonly attackerRows = computed<SideRow[]>(() => this.rowsFor('attacker'));
  protected readonly defenderRows = computed<SideRow[]>(() => this.rowsFor('defender'));

  private rowsFor(side: 'attacker' | 'defender'): SideRow[] {
    const b = this.battle.value();
    if (!b) return [];
    const units: BattleUnit[] = side === 'attacker' ? b.attacker_units : b.defender_units;
    const losses: BattleLoss[] = side === 'attacker' ? b.attacker_losses : b.defender_losses;
    const lossByCode = new Map<string, number>();
    for (const l of losses) lossByCode.set(l.code, (lossByCode.get(l.code) ?? 0) + l.count);
    return units.map((u) => {
      const lost = lossByCode.get(u.code) ?? 0;
      return { unit: u, lost, remaining: Math.max(0, u.count - lost) };
    });
  }

  protected repBadge(delta: number): 'success' | 'danger' | 'default' {
    if (delta > 0) return 'success';
    if (delta < 0) return 'danger';
    return 'default';
  }
}
