import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule, Search, Gift, ShieldOff, ShieldCheck, RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../shared/pipes/format-number.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { GrantDialogComponent } from './dialogs/grant-dialog';
import { BanDialogComponent } from './dialogs/ban-dialog';

@Component({
  selector: 'tt-admin-players',
  imports: [
    ReactiveFormsModule, BadgeComponent, ButtonComponent, CardComponent,
    EmptyStateComponent, SpinnerComponent, LucideAngularModule, FormatNumberPipe, TimeAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <lucide-angular [img]="Search" [size]="14" />
          </span>
          <input
            type="search"
            placeholder="Search by username or email"
            [formControl]="search"
            class="w-full h-9 pl-8 pr-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </div>

      @if (resource.isLoading()) {
        <tt-card><div class="flex justify-center py-8"><tt-spinner /></div></tt-card>
      } @else if (rows().length === 0) {
        <tt-card>
          <tt-empty-state title="No players found" />
        </tt-card>
      } @else {
        <tt-card padding="sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-[11px] uppercase tracking-wide text-zinc-500">
                <tr class="border-b border-zinc-800">
                  <th class="text-left py-2 px-2 font-medium">Player</th>
                  <th class="text-left py-2 px-2 font-medium">Role</th>
                  <th class="text-right py-2 px-2 font-medium">Lvl</th>
                  <th class="text-right py-2 px-2 font-medium">Coins</th>
                  <th class="text-right py-2 px-2 font-medium">Gems</th>
                  <th class="text-left py-2 px-2 font-medium">Joined</th>
                  <th class="text-left py-2 px-2 font-medium">Status</th>
                  <th class="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of rows(); track u.id) {
                  <tr class="border-b border-zinc-800/50 last:border-0">
                    <td class="py-2 px-2">
                      <p class="text-zinc-100 font-medium">{{ u.username }}</p>
                      <p class="text-[11px] text-zinc-500">{{ u.email }}</p>
                    </td>
                    <td class="py-2 px-2">
                      <tt-badge [variant]="u.role === 'admin' ? 'gold' : 'default'">{{ u.role }}</tt-badge>
                    </td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ u.level }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-amber-300">{{ u.coins | ttFormatNumber }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-cyan-300">{{ u.gems | ttFormatNumber }}</td>
                    <td class="py-2 px-2 text-zinc-400 text-xs whitespace-nowrap">{{ u.createdAt | ttTimeAgo }}</td>
                    <td class="py-2 px-2">
                      @if (u.is_banned) {
                        <tt-badge variant="danger">banned</tt-badge>
                      } @else {
                        <tt-badge variant="success">active</tt-badge>
                      }
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="inline-flex items-center gap-1">
                        <tt-button size="sm" variant="ghost" (clicked)="grant(u)">
                          <lucide-angular [img]="Gift" [size]="13" />
                          Grant
                        </tt-button>
                        @if (u.is_banned) {
                          <tt-button size="sm" variant="ghost" [loading]="actingId() === u.id + ':unban'" (clicked)="unban(u)">
                            <lucide-angular [img]="ShieldCheck" [size]="13" />
                            Unban
                          </tt-button>
                        } @else {
                          <tt-button size="sm" variant="ghost" (clicked)="ban(u)">
                            <lucide-angular [img]="ShieldOff" [size]="13" />
                            Ban
                          </tt-button>
                        }
                        @if (u.role === 'user') {
                          <tt-button size="sm" variant="ghost" [loading]="actingId() === u.id + ':promote'" (clicked)="promote(u)">
                            <lucide-angular [img]="ArrowUp" [size]="13" />
                          </tt-button>
                        } @else {
                          <tt-button size="sm" variant="ghost" [loading]="actingId() === u.id + ':demote'" (clicked)="demote(u)">
                            <lucide-angular [img]="ArrowDown" [size]="13" />
                          </tt-button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-zinc-500 mt-3 text-right">
            {{ rows().length }} of {{ resource.value()?.total ?? 0 }} players
          </p>
        </tt-card>
      }
    </div>
  `,
})
export default class AdminPlayersComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Search = Search;
  protected readonly Gift = Gift;
  protected readonly ShieldOff = ShieldOff;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly RefreshCw = RefreshCw;
  protected readonly ArrowUp = ArrowUp;
  protected readonly ArrowDown = ArrowDown;

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly searchSignal = signal('');
  protected readonly actingId = signal<string | null>(null);

  constructor() {
    this.search.valueChanges.subscribe((v) => {
      const trimmed = (v ?? '').trim();
      setTimeout(() => this.searchSignal.set(trimmed), 250);
    });
  }

  protected readonly resource = rxResource({
    params: () => this.searchSignal(),
    stream: ({ params: q }) =>
      this.admin.listPlayers({ limit: 100, q: q || undefined }),
  });

  protected readonly rows = computed<User[]>(() => this.resource.value()?.items ?? []);

  protected reload(): void {
    this.resource.reload();
  }

  protected grant(u: User): void {
    const ref = this.dialog.open(GrantDialogComponent, {
      data: { userId: u.id, username: u.username },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((granted) => { if (granted) this.resource.reload(); });
  }

  protected ban(u: User): void {
    const ref = this.dialog.open(BanDialogComponent, {
      data: { userId: u.id, username: u.username },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((banned) => { if (banned) this.resource.reload(); });
  }

  protected unban(u: User): void {
    if (this.actingId()) return;
    this.actingId.set(`${u.id}:unban`);
    this.admin.unbanPlayer(u.id).subscribe({
      next: () => {
        this.actingId.set(null);
        this.toast.success(`Unbanned ${u.username}`);
        this.resource.reload();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.toast.error('Unban failed', err.message);
      },
    });
  }

  protected promote(u: User): void {
    this.setRole(u, 'admin', 'promote');
  }

  protected demote(u: User): void {
    this.setRole(u, 'user', 'demote');
  }

  private setRole(u: User, role: 'user' | 'admin', label: 'promote' | 'demote'): void {
    if (this.actingId()) return;
    this.actingId.set(`${u.id}:${label}`);
    this.admin.setPlayerRole(u.id, role).subscribe({
      next: () => {
        this.actingId.set(null);
        this.toast.success(`${u.username} is now ${role}`);
        this.resource.reload();
      },
      error: (err: ApiError) => {
        this.actingId.set(null);
        this.toast.error('Role change failed', err.message);
      },
    });
  }
}
