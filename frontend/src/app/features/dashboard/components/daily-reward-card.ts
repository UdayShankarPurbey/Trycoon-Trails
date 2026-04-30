import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Gift, Flame } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/services/api.service';
import { DailyRewardService } from '../../../core/services/daily-reward.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';

@Component({
  selector: 'tt-daily-reward-card',
  imports: [CardComponent, ButtonComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Daily reward" subtitle="Log in every day to grow your streak">
      <div class="flex items-center gap-4">
        <span class="shrink-0 inline-flex items-center justify-center h-14 w-14 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-600/30">
          <lucide-angular [img]="Gift" [size]="26" />
        </span>
        <div class="flex-1">
          <p class="text-sm text-zinc-300">
            Streak day:
            <span class="text-amber-300 font-semibold inline-flex items-center gap-1">
              <lucide-angular [img]="Flame" [size]="14" />
              {{ streak() }}
            </span>
          </p>
          <p class="text-xs text-zinc-500">Bigger rewards every day, peaks at day 7.</p>
        </div>
        <tt-button (clicked)="claim()" [loading]="loading()">
          Claim
        </tt-button>
      </div>
    </tt-card>
  `,
})
export class DailyRewardCardComponent {
  private readonly daily = inject(DailyRewardService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly streak = signal<number>(this.auth.user()?.daily_streak ?? 0);

  protected readonly Gift = Gift;
  protected readonly Flame = Flame;

  protected claim(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.daily.claim().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.streak.set(res.streak);
        const u = this.auth.user();
        if (u) {
          this.auth.setUser({
            ...u,
            coins: res.balances.coins,
            gems: res.balances.gems,
            xp: res.balances.xp,
            level: res.balances.level,
            daily_streak: res.streak,
          });
        }
        this.toast.success(
          `Day ${res.streak} reward claimed`,
          `+${res.reward.coins} coins, +${res.reward.gems} gems, +${res.reward.xp} xp`,
        );
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.warning('Cannot claim yet', err.message);
      },
    });
  }
}
