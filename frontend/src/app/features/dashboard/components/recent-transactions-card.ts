import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { History } from 'lucide-angular';
import { TransactionService } from '../../../core/services/transaction.service';
import { ResourceTransaction } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-recent-transactions-card',
  imports: [
    CardComponent, BadgeComponent, EmptyStateComponent, SpinnerComponent,
    FormatNumberPipe, TimeAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card [title]="title()" subtitle="Resource activity">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (rows().length === 0) {
        <tt-empty-state [icon]="History" title="No transactions yet" />
      } @else {
        <ul class="divide-y divide-zinc-800 text-sm">
          @for (t of rows(); track t.id) {
            <li class="py-2 flex items-center justify-between gap-3">
              <div class="min-w-0 flex items-center gap-2">
                <tt-badge [variant]="t.amount >= 0 ? 'success' : 'danger'">{{ t.kind }}</tt-badge>
                <span class="text-zinc-400 truncate">{{ t.reason }}</span>
              </div>
              <div class="text-right shrink-0">
                <p [class]="'tabular-nums font-medium ' + (t.amount >= 0 ? 'text-emerald-300' : 'text-red-300')">
                  {{ t.amount >= 0 ? '+' : '' }}{{ t.amount | ttFormatNumber }}
                </p>
                <p class="text-[11px] text-zinc-500">{{ t.createdAt | ttTimeAgo }}</p>
              </div>
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class RecentTransactionsCardComponent {
  private readonly txService = inject(TransactionService);

  readonly limit = input<number>(8);
  readonly title = input<string>('Recent transactions');

  protected readonly History = History;
  protected readonly resource = rxResource({
    stream: () => this.txService.listMine({ limit: this.limit(), offset: 0 }),
  });
  protected readonly rows = computed<ResourceTransaction[]>(() => this.resource.value()?.items ?? []);
}
