import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, FileClock, RefreshCw } from 'lucide-angular';
import { AdminService, AuditEntry } from '../../core/services/admin.service';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-admin-audit-log',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, EmptyStateComponent, SpinnerComponent,
    LucideAngularModule, TimeAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex justify-end">
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </div>

      @if (resource.isLoading()) {
        <tt-card><div class="flex justify-center py-8"><tt-spinner /></div></tt-card>
      } @else if (rows().length === 0) {
        <tt-card>
          <tt-empty-state [icon]="FileClock" title="Audit log is empty" />
        </tt-card>
      } @else {
        <tt-card padding="sm">
          <ul class="divide-y divide-zinc-800">
            @for (e of rows(); track e.id) {
              <li class="py-2.5 flex items-start gap-3">
                <tt-badge variant="default">{{ e.action }}</tt-badge>
                <div class="flex-1 min-w-0">
                  <p class="text-sm">
                    <span class="text-zinc-300">{{ e.admin?.username ?? 'unknown admin' }}</span>
                    <span class="text-zinc-500"> on </span>
                    <span class="text-zinc-100">{{ e.target_table }}</span>
                    @if (e.target_id) {
                      <span class="text-zinc-500"> #{{ e.target_id.slice(0, 8) }}…</span>
                    }
                  </p>
                  @if (payloadSummary(e); as p) {
                    <p class="text-[11px] text-zinc-500 mt-0.5 truncate">{{ p }}</p>
                  }
                </div>
                <span class="text-[11px] text-zinc-500 shrink-0 whitespace-nowrap">
                  {{ e.createdAt | ttTimeAgo }}
                </span>
              </li>
            }
          </ul>
          <p class="text-[11px] text-zinc-500 mt-3 text-right">
            {{ rows().length }} of {{ resource.value()?.total ?? 0 }} entries
          </p>
        </tt-card>
      }
    </div>
  `,
})
export default class AdminAuditLogComponent {
  private readonly admin = inject(AdminService);

  protected readonly FileClock = FileClock;
  protected readonly RefreshCw = RefreshCw;

  protected readonly resource = rxResource({
    stream: () => this.admin.listAuditLog({ limit: 100 }),
  });

  protected readonly rows = computed<AuditEntry[]>(() => this.resource.value()?.items ?? []);

  protected payloadSummary(e: AuditEntry): string | null {
    if (!e.payload || typeof e.payload !== 'object') return null;
    try {
      return JSON.stringify(e.payload);
    } catch {
      return null;
    }
  }

  protected reload(): void {
    this.resource.reload();
  }
}
