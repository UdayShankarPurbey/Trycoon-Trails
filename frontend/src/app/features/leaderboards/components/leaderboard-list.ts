import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, Crown } from 'lucide-angular';
import { LeaderboardEntry } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

@Component({
  selector: 'tt-leaderboard-list',
  imports: [BadgeComponent, EmptyStateComponent, LucideAngularModule, FormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (entries().length === 0) {
      <tt-empty-state [icon]="Crown" title="No entries yet" />
    } @else {
      <ol class="divide-y divide-zinc-800">
        @for (e of entries(); track e.user_id) {
          <li [class]="rowClass(e)">
            <span [class]="rankClass(e.rank)">{{ e.rank }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{{ e.username }}</p>
                @if (e.user_id === currentUserId()) {
                  <tt-badge variant="gold">You</tt-badge>
                }
                @if (e.level !== null) {
                  <span class="text-[11px] text-zinc-500">L{{ e.level }}</span>
                }
              </div>
            </div>
            <span class="text-sm font-semibold tabular-nums">
              {{ e.score | ttFormatNumber }}
            </span>
          </li>
        }
      </ol>
    }
  `,
})
export class LeaderboardListComponent {
  readonly entries = input.required<LeaderboardEntry[]>();
  readonly currentUserId = input<string | null>(null);

  protected readonly Crown = Crown;

  protected rowClass(e: LeaderboardEntry): string {
    return [
      'flex items-center gap-3 py-2 px-1',
      e.user_id === this.currentUserId() ? 'bg-amber-500/5 -mx-1 px-2 rounded' : '',
    ].join(' ');
  }

  protected rankClass(rank: number): string {
    let color = 'bg-zinc-800 text-zinc-300';
    if (rank === 1) color = 'bg-amber-500/20 text-amber-300 border border-amber-600/40';
    else if (rank === 2) color = 'bg-zinc-300/20 text-zinc-200 border border-zinc-500/40';
    else if (rank === 3) color = 'bg-orange-500/20 text-orange-300 border border-orange-600/40';
    return `inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold tabular-nums ${color}`;
  }
}
