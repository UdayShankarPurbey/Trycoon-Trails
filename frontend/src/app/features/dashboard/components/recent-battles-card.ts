import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Swords } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { BattleService } from '../../../core/services/battle.service';
import { Battle } from '../../../core/types';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { BattleRowComponent } from '../../battles/components/battle-row';

@Component({
  selector: 'tt-recent-battles-card',
  imports: [CardComponent, EmptyStateComponent, SpinnerComponent, BattleRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card [title]="title()" subtitle="Your latest engagements">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (rows().length === 0) {
        <tt-empty-state
          [icon]="Swords"
          title="No battles yet"
          description="Once you start attacking, your reports will appear here." />
      } @else {
        <ul class="divide-y divide-zinc-800">
          @for (b of rows(); track b.id) {
            <tt-battle-row
              [battle]="b"
              [currentUserId]="user()?.id ?? null"
              (activated)="open(b)" />
          }
        </ul>
      }
    </tt-card>
  `,
})
export class RecentBattlesCardComponent {
  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly limit = input<number>(5);
  readonly title = input<string>('Recent battles');

  protected readonly Swords = Swords;
  protected readonly user = this.auth.user;

  protected readonly resource = rxResource({
    stream: () => this.battleService.myBattles({ limit: this.limit(), offset: 0 }),
  });
  protected readonly rows = computed<Battle[]>(() => this.resource.value()?.items ?? []);

  protected open(b: Battle): void {
    void this.router.navigate(['/battles', b.id]);
  }
}
