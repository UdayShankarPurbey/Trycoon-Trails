import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule, RefreshCw, Users, ShieldOff, Map, Building2, Swords, Trophy, Coins, Gem, Bell, Target, ShieldCheck, Activity,
} from 'lucide-angular';
import { AdminService } from '../../core/services/admin.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { StatTileComponent } from '../../shared/ui/stat-tile/stat-tile';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar';
import { FormatNumberPipe } from '../../shared/pipes/format-number.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-admin-stats',
  imports: [
    StatTileComponent, CardComponent, SpinnerComponent, ButtonComponent,
    ProgressBarComponent, LucideAngularModule, FormatNumberPipe, TimeAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-zinc-500">
          @if (resource.value(); as d) {
            Last refreshed {{ d.timestamp | ttTimeAgo }}
          }
        </p>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </div>

      @if (resource.isLoading() && !resource.value()) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (resource.value(); as d) {
        <section>
          <h3 class="text-sm font-semibold text-zinc-300 mb-2">Users</h3>
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <tt-stat-tile label="Total"          [value]="d.users.total"          [icon]="Users"        accent="bg-amber-500/15 text-amber-300" />
            <tt-stat-tile label="Admins"         [value]="d.users.admins"         [icon]="ShieldCheck"  accent="bg-violet-500/15 text-violet-300" />
            <tt-stat-tile label="Banned"         [value]="d.users.banned"         [icon]="ShieldOff"    accent="bg-red-500/15 text-red-300" />
            <tt-stat-tile label="Active today"   [value]="d.users.active_today"   [icon]="Activity"     accent="bg-emerald-500/15 text-emerald-300" />
            <tt-stat-tile label="Active this week" [value]="d.users.active_week" [icon]="Activity"     accent="bg-emerald-500/15 text-emerald-300" />
          </div>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-zinc-300 mb-2">World</h3>
          <tt-card>
            <div class="grid grid-cols-3 gap-3 mb-3">
              <tt-stat-tile label="Total tiles" [value]="d.world.total_tiles" [icon]="Map" accent="bg-zinc-700/40 text-zinc-200" />
              <tt-stat-tile label="Owned"        [value]="d.world.owned"        [icon]="Map" accent="bg-emerald-500/15 text-emerald-300" />
              <tt-stat-tile label="Unclaimed"    [value]="d.world.unowned"      [icon]="Map" accent="bg-zinc-700/40 text-zinc-300" />
            </div>
            <tt-progress-bar
              [value]="d.world.owned"
              [max]="d.world.total_tiles"
              [label]="'Ownership: ' + d.world.ownership_pct + '%'" />
          </tt-card>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-zinc-300 mb-2">Economy</h3>
          <div class="grid grid-cols-2 gap-3">
            <tt-stat-tile label="Coins in circulation" [value]="(d.economy.total_coins_in_circulation | ttFormatNumber)" [icon]="Coins" accent="bg-amber-500/15 text-amber-300" />
            <tt-stat-tile label="Gems in circulation"  [value]="(d.economy.total_gems_in_circulation | ttFormatNumber)"  [icon]="Gem"   accent="bg-cyan-500/15 text-cyan-300" />
          </div>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-zinc-300 mb-2">Gameplay</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <tt-stat-tile label="Businesses"    [value]="d.gameplay.businesses"            [icon]="Building2" accent="bg-amber-500/15 text-amber-300" />
            <tt-stat-tile label="Army units"    [value]="(d.gameplay.army_units | ttFormatNumber)" [icon]="Swords"   accent="bg-rose-500/15 text-rose-300" />
            <tt-stat-tile label="Battles total" [value]="d.gameplay.battles_total"         [icon]="Trophy"   accent="bg-violet-500/15 text-violet-300" />
            <tt-stat-tile label="Captures"      [value]="d.gameplay.territories_captured"  [icon]="Trophy"   accent="bg-amber-500/15 text-amber-300" />
          </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tt-card title="Content">
            <div class="grid grid-cols-2 gap-3">
              <tt-stat-tile label="Missions total"  [value]="d.content.missions_total"  [icon]="Target" accent="bg-cyan-500/15 text-cyan-300" />
              <tt-stat-tile label="Missions active" [value]="d.content.missions_active" [icon]="Target" accent="bg-emerald-500/15 text-emerald-300" />
            </div>
          </tt-card>
          <tt-card title="Notifications">
            <div class="grid grid-cols-2 gap-3">
              <tt-stat-tile label="Total"  [value]="(d.notifications.total | ttFormatNumber)"  [icon]="Bell" accent="bg-zinc-700/40 text-zinc-300" />
              <tt-stat-tile label="Unread" [value]="d.notifications.unread" [icon]="Bell" accent="bg-amber-500/15 text-amber-300" />
            </div>
          </tt-card>
        </section>
      }
    </div>
  `,
})
export default class AdminStatsComponent {
  private readonly admin = inject(AdminService);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Users = Users;
  protected readonly ShieldOff = ShieldOff;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly Activity = Activity;
  protected readonly Map = Map;
  protected readonly Building2 = Building2;
  protected readonly Swords = Swords;
  protected readonly Trophy = Trophy;
  protected readonly Coins = Coins;
  protected readonly Gem = Gem;
  protected readonly Target = Target;
  protected readonly Bell = Bell;

  protected readonly resource = rxResource({ stream: () => this.admin.stats() });

  protected reload(): void {
    this.resource.reload();
  }
}
