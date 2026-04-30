import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule, Bell, CheckCheck, RefreshCw } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { AppNotification } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { NotificationRowComponent } from './components/notification-row';

@Component({
  selector: 'tt-notifications',
  imports: [
    NotificationRowComponent, CardComponent, EmptyStateComponent, SpinnerComponent,
    ButtonComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-3xl">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold">Notifications</h2>
          <p class="text-sm text-zinc-400">
            {{ unreadCount() }} unread of {{ all().length }}.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <tt-button
            variant="ghost"
            size="sm"
            [disabled]="markingAll() || unreadCount() === 0"
            (clicked)="markAll()">
            <lucide-angular [img]="CheckCheck" [size]="14" />
            Mark all read
          </tt-button>
          <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
            <lucide-angular [img]="RefreshCw" [size]="14" />
            Refresh
          </tt-button>
        </div>
      </header>

      <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden">
        <button type="button" (click)="filter.set('all')" [class]="filterClass('all')">All</button>
        <button type="button" (click)="filter.set('unread')" [class]="filterClass('unread')">
          Unread
          @if (unreadCount() > 0) {
            <span class="ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-semibold">
              {{ unreadCount() }}
            </span>
          }
        </button>
      </div>

      @if (resource.isLoading() && all().length === 0) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (filtered().length === 0) {
        <tt-card>
          <tt-empty-state
            [icon]="Bell"
            [title]="filter() === 'unread' ? 'No unread notifications' : 'No notifications yet'"
            description="Activity from battles, missions, and admins will land here." />
        </tt-card>
      } @else {
        <tt-card padding="sm">
          <ul class="divide-y divide-zinc-800">
            @for (n of filtered(); track n.id) {
              <tt-notification-row
                [notification]="n"
                (activated)="open(n)" />
            }
          </ul>
        </tt-card>
      }
    </div>
  `,
})
export default class NotificationsComponent {
  private readonly notifService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly Bell = Bell;
  protected readonly CheckCheck = CheckCheck;
  protected readonly RefreshCw = RefreshCw;

  protected readonly filter = signal<'all' | 'unread'>('all');
  protected readonly markingAll = signal(false);

  protected readonly resource = rxResource({
    stream: () => this.notifService.list({ limit: 100, offset: 0 }),
  });

  protected readonly all = computed<AppNotification[]>(() => this.resource.value()?.items ?? []);
  protected readonly unreadCount = computed(() => this.all().filter((n) => !n.is_read).length);

  protected readonly filtered = computed<AppNotification[]>(() => {
    return this.filter() === 'unread' ? this.all().filter((n) => !n.is_read) : this.all();
  });

  protected filterClass(value: 'all' | 'unread'): string {
    const active = this.filter() === value;
    return `px-3 h-8 text-xs font-medium inline-flex items-center ${
      active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  protected open(n: AppNotification): void {
    if (!n.is_read) {
      this.notifService.markRead(n.id).subscribe({
        next: () => this.resource.reload(),
        error: () => undefined,
      });
    }
    const link = this.linkFor(n);
    if (link) void this.router.navigateByUrl(link);
  }

  private linkFor(n: AppNotification): string | null {
    const data = (n.data ?? {}) as Record<string, unknown>;
    if (n.type === 'territory_captured' || n.type === 'battle_attacked' || n.type === 'battle_defended') {
      const id = typeof data['territory_id'] === 'string' ? (data['territory_id'] as string) : null;
      return id ? `/world/${id}` : null;
    }
    if (n.type === 'mission_complete') return '/missions';
    if (n.type === 'level_up') return '/dashboard';
    return null;
  }

  protected markAll(): void {
    if (this.markingAll() || this.unreadCount() === 0) return;
    this.markingAll.set(true);
    this.notifService.markAllRead().subscribe({
      next: ({ marked }) => {
        this.markingAll.set(false);
        this.toast.success(`Marked ${marked} as read`);
        this.resource.reload();
      },
      error: (err: ApiError) => {
        this.markingAll.set(false);
        this.toast.error('Failed to mark all read', err.message);
      },
    });
  }

  protected reload(): void {
    this.resource.reload();
  }
}
