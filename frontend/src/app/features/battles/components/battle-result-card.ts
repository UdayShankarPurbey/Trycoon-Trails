import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule, Crown, Swords, Shield, ShieldOff } from 'lucide-angular';
import { Battle } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { CardComponent } from '../../../shared/ui/card/card';

@Component({
  selector: 'tt-battle-result-card',
  imports: [CardComponent, BadgeComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card>
      <div class="flex items-start gap-4">
        <span [class]="iconWrap()">
          <lucide-angular [img]="iconFor()" [size]="22" />
        </span>
        <div class="flex-1 min-w-0">
          <h2 [class]="titleClass()">{{ headline() }}</h2>
          <p class="text-sm text-zinc-400 mt-0.5">{{ subline() }}</p>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          @if (battle().territory_captured) {
            <tt-badge variant="gold">
              <lucide-angular [img]="Crown" [size]="11" />
              Captured
            </tt-badge>
          }
          <tt-badge [variant]="won() ? 'success' : 'danger'">
            {{ won() ? 'Victory' : 'Defeat' }}
          </tt-badge>
        </div>
      </div>
    </tt-card>
  `,
})
export class BattleResultCardComponent {
  readonly battle = input.required<Battle>();
  readonly currentUserId = input.required<string | null>();

  protected readonly Crown = Crown;
  protected readonly Swords = Swords;
  protected readonly Shield = Shield;
  protected readonly ShieldOff = ShieldOff;

  protected readonly asAttacker = computed(
    () => this.battle().attacker_id === this.currentUserId(),
  );
  protected readonly won = computed(() => this.battle().winner_id === this.currentUserId());

  protected iconFor() {
    if (this.battle().territory_captured) return this.Crown;
    if (this.asAttacker()) return this.won() ? this.Swords : this.ShieldOff;
    return this.won() ? this.Shield : this.ShieldOff;
  }

  protected iconWrap(): string {
    const ok = this.won();
    return `shrink-0 w-12 h-12 inline-flex items-center justify-center rounded-lg ${
      ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-700' : 'bg-red-500/15 text-red-300 border border-red-700'
    }`;
  }

  protected titleClass(): string {
    return `text-lg font-semibold ${this.won() ? 'text-emerald-300' : 'text-red-300'}`;
  }

  protected headline(): string {
    const b = this.battle();
    if (this.asAttacker()) {
      return this.won()
        ? (b.territory_captured ? 'Victory! Territory captured.' : 'Victory!')
        : 'Your attack failed.';
    }
    return this.won() ? 'You repelled the attack!' : 'Your territory fell.';
  }

  protected subline(): string {
    const b = this.battle();
    const other = this.asAttacker()
      ? (b.defender?.username ?? 'unowned tile')
      : (b.attacker?.username ?? 'unknown');
    const t = b.territory ? `(${b.territory.x},${b.territory.y})` : '';
    return `${this.asAttacker() ? 'Attacked' : 'Defended against'} ${other} ${t}`.trim();
  }
}
