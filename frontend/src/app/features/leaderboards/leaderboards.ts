import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, RefreshCw, Crown, Coins, Gem, Star, Award, Sword, Sparkles } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { LeaderboardKind } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { LeaderboardListComponent } from './components/leaderboard-list';

interface KindOption {
  value: LeaderboardKind;
  label: string;
  icon: typeof Crown;
  accent: string;
}

const KINDS: KindOption[] = [
  { value: 'coins',        label: 'Coins',        icon: Coins,    accent: 'text-amber-300' },
  { value: 'level',        label: 'Level',        icon: Award,    accent: 'text-violet-300' },
  { value: 'xp',           label: 'XP',           icon: Sparkles, accent: 'text-fuchsia-300' },
  { value: 'reputation',   label: 'Reputation',   icon: Star,     accent: 'text-emerald-300' },
  { value: 'gems',         label: 'Gems',         icon: Gem,      accent: 'text-cyan-300' },
  { value: 'battles_won',  label: 'Battles won',  icon: Sword,    accent: 'text-rose-300' },
];

@Component({
  selector: 'tt-leaderboards',
  imports: [
    LeaderboardListComponent, CardComponent, SpinnerComponent, ButtonComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-3xl">
      <header class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Leaderboards</h2>
          <p class="text-sm text-zinc-400">Top players across the empire.</p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="data.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      <div class="flex flex-wrap gap-1.5">
        @for (k of kinds; track k.value) {
          <button
            type="button"
            (click)="kind.set(k.value)"
            [class]="tabClass(k.value)">
            <lucide-angular [img]="k.icon" [size]="12" [class]="k.accent" />
            {{ k.label }}
          </button>
        }
      </div>

      @if (data.isLoading()) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (data.value(); as d) {
        @if (d.rank.rank !== null) {
          <tt-card>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/15 text-amber-300 border border-amber-600/30 text-sm font-bold">
                  #{{ d.rank.rank }}
                </span>
                <div>
                  <p class="text-sm font-medium">Your rank in {{ activeKindLabel() }}</p>
                  <p class="text-[11px] text-zinc-500 tabular-nums">Score: {{ d.rank.score }}</p>
                </div>
              </div>
              @if (currentUserId(); as me) {
                @if (d.top.items.length && d.top.items[0].user_id === me) {
                  <span class="inline-flex items-center gap-1 text-xs text-amber-300">
                    <lucide-angular [img]="Crown" [size]="12" />
                    King of the leaderboard
                  </span>
                }
              }
            </div>
          </tt-card>
        }

        <tt-card title="Top 25" [subtitle]="activeKindLabel()">
          <tt-leaderboard-list
            [entries]="d.top.items"
            [currentUserId]="currentUserId()" />
        </tt-card>
      }
    </div>
  `,
})
export default class LeaderboardsComponent {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly auth = inject(AuthService);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Crown = Crown;
  protected readonly kinds = KINDS;

  protected readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  protected readonly kind = signal<LeaderboardKind>('coins');

  protected readonly data = rxResource({
    params: () => this.kind(),
    stream: ({ params: kind }) =>
      forkJoin({
        top: this.leaderboardService.top(kind, { limit: 25 }),
        rank: this.leaderboardService.myRank(kind),
      }),
  });

  protected readonly activeKindLabel = computed(
    () => KINDS.find((k) => k.value === this.kind())?.label ?? '',
  );

  protected tabClass(value: LeaderboardKind): string {
    const active = this.kind() === value;
    return `px-3 h-8 text-xs font-medium inline-flex items-center gap-1.5 rounded-md border ${
      active
        ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
    }`;
  }

  protected reload(): void {
    this.data.reload();
  }
}
