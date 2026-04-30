import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, ChevronRight, Swords, Shield, Crown } from 'lucide-angular';
import { Battle } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-battle-row',
  imports: [BadgeComponent, LucideAngularModule, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li>
      <button
        type="button"
        (click)="activated.emit()"
        class="w-full text-left flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-800/60 transition">
        <div class="min-w-0 flex items-center gap-2.5">
          <span [class]="iconWrapClass()">
            <lucide-angular [img]="iconForRow()" [size]="14" />
          </span>
          <div class="min-w-0">
            <p class="text-sm">
              <span class="text-zinc-300">{{ asAttacker() ? 'You attacked' : 'Defended against' }}</span>
              <span class="ml-1 text-zinc-100 font-medium">{{ otherName() }}</span>
              @if (battle().territory; as t) {
                <span class="text-zinc-500 ml-1">@ ({{ t.x }},{{ t.y }})</span>
              }
            </p>
            <p class="text-[11px] text-zinc-500">{{ battle().createdAt | ttTimeAgo }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          @if (battle().territory_captured) {
            <tt-badge variant="gold">
              <lucide-angular [img]="Crown" [size]="11" />
              Captured
            </tt-badge>
          }
          <tt-badge [variant]="won() ? 'success' : 'danger'">
            {{ won() ? 'Win' : 'Loss' }}
          </tt-badge>
          @if (showChevron()) {
            <lucide-angular [img]="ChevronRight" [size]="14" class="text-zinc-500" />
          }
        </div>
      </button>
    </li>
  `,
})
export class BattleRowComponent {
  readonly battle = input.required<Battle>();
  readonly currentUserId = input.required<string | null>();
  readonly showChevron = input<boolean>(true);

  readonly activated = output<void>();

  protected readonly ChevronRight = ChevronRight;
  protected readonly Swords = Swords;
  protected readonly Shield = Shield;
  protected readonly Crown = Crown;

  protected readonly asAttacker = computed(
    () => this.battle().attacker_id === this.currentUserId(),
  );

  protected readonly won = computed(() => this.battle().winner_id === this.currentUserId());

  protected readonly otherName = computed(() => {
    const b = this.battle();
    return this.asAttacker()
      ? (b.defender?.username ?? 'unowned tile')
      : (b.attacker?.username ?? 'unknown');
  });

  protected iconForRow() {
    return this.asAttacker() ? this.Swords : this.Shield;
  }

  protected iconWrapClass(): string {
    const w = this.won();
    const a = this.asAttacker();
    const color = w ? 'text-emerald-300 bg-emerald-500/15' : 'text-rose-300 bg-rose-500/15';
    return `${a ? 'rotate-0' : ''} shrink-0 w-7 h-7 inline-flex items-center justify-center rounded ${color}`;
  }
}
