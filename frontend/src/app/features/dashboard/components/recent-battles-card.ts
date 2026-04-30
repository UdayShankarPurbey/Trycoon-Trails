import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Swords } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { BattleService } from '../../../core/services/battle.service';
import { Battle } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-recent-battles-card',
  imports: [CardComponent, BadgeComponent, EmptyStateComponent, SpinnerComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card [title]="title()" subtitle="Your latest engagements">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (rows().length === 0) {
        <tt-empty-state [icon]="Swords" title="No battles yet" description="Once you start attacking, your reports will appear here." />
      } @else {
        <ul class="divide-y divide-zinc-800">
          @for (b of rows(); track b.id) {
            <li class="py-2.5 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm">
                  <span class="text-zinc-300">{{ side(b) === 'attacker' ? 'You attacked' : 'Defended against' }}</span>
                  <span class="ml-1 text-zinc-100 font-medium">{{ otherName(b) }}</span>
                  @if (b.territory) {
                    <span class="text-zinc-500 ml-1">@ ({{ b.territory.x }},{{ b.territory.y }})</span>
                  }
                </p>
                <p class="text-[11px] text-zinc-500">{{ b.createdAt | ttTimeAgo }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                @if (b.territory_captured) {
                  <tt-badge variant="gold">Captured</tt-badge>
                }
                <tt-badge [variant]="won(b) ? 'success' : 'danger'">
                  {{ won(b) ? 'Win' : 'Loss' }}
                </tt-badge>
              </div>
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class RecentBattlesCardComponent {
  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);

  readonly limit = input<number>(5);
  readonly title = input<string>('Recent battles');

  protected readonly Swords = Swords;
  protected readonly resource = rxResource({
    stream: () => this.battleService.myBattles({ limit: this.limit(), offset: 0 }),
  });
  protected readonly rows = computed<Battle[]>(() => this.resource.value()?.items ?? []);

  protected side(b: Battle): 'attacker' | 'defender' {
    return b.attacker_id === this.auth.user()?.id ? 'attacker' : 'defender';
  }

  protected otherName(b: Battle): string {
    return this.side(b) === 'attacker' ? (b.defender?.username ?? 'unowned tile') : (b.attacker?.username ?? 'unknown');
  }

  protected won(b: Battle): boolean {
    return b.winner_id === this.auth.user()?.id;
  }
}
