import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ActiveMissionsCardComponent } from './components/active-missions-card';
import { DailyRewardCardComponent } from './components/daily-reward-card';
import { LevelProgressCardComponent } from './components/level-progress-card';
import { RecentBattlesCardComponent } from './components/recent-battles-card';
import { RecentTransactionsCardComponent } from './components/recent-transactions-card';
import { StatsGridComponent } from './components/stats-grid';

@Component({
  selector: 'tt-dashboard',
  imports: [
    LevelProgressCardComponent,
    StatsGridComponent,
    DailyRewardCardComponent,
    ActiveMissionsCardComponent,
    RecentBattlesCardComponent,
    RecentTransactionsCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-6xl">
      <header>
        <h2 class="text-xl font-semibold">Welcome back, {{ user()?.username }}</h2>
        <p class="text-sm text-zinc-400">Your empire at a glance.</p>
      </header>

      <tt-stats-grid />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <tt-level-progress-card />
        <tt-daily-reward-card />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <tt-active-missions-card />
        <tt-recent-battles-card />
      </div>

      <tt-recent-transactions-card [limit]="10" />
    </div>
  `,
})
export default class DashboardComponent {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
}
