import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule, RefreshCw, Swords } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { BattleService } from '../../core/services/battle.service';
import { Battle } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { BattleRowComponent } from './components/battle-row';

type BattleFilter = 'all' | 'wins' | 'losses' | 'attacker' | 'defender' | 'captures';

const FILTERS: { value: BattleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
  { value: 'attacker', label: 'As attacker' },
  { value: 'defender', label: 'As defender' },
  { value: 'captures', label: 'Captures' },
];

@Component({
  selector: 'tt-battles',
  imports: [
    BattleRowComponent, CardComponent, EmptyStateComponent, SpinnerComponent,
    ButtonComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-4xl">
      <header class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Battles</h2>
          <p class="text-sm text-zinc-400">Your full combat history.</p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden flex-wrap">
        @for (f of filters; track f.value) {
          <button
            type="button"
            (click)="filter.set(f.value)"
            [class]="filterClass(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (resource.isLoading() && all().length === 0) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (resource.error()) {
        <tt-card>
          <p class="text-sm text-red-300">Failed to load battles.</p>
        </tt-card>
      } @else if (filtered().length === 0) {
        <tt-card>
          <tt-empty-state
            [icon]="Swords"
            title="No battles match this filter"
            description="Adjust the filter or attack a territory to start fighting." />
        </tt-card>
      } @else {
        <tt-card padding="sm">
          <ul class="divide-y divide-zinc-800">
            @for (b of filtered(); track b.id) {
              <tt-battle-row
                [battle]="b"
                [currentUserId]="user()?.id ?? null"
                (activated)="open(b)" />
            }
          </ul>
          <p class="text-[11px] text-zinc-500 mt-3 text-right">
            Showing {{ filtered().length }} of {{ all().length }} battles
          </p>
        </tt-card>
      }
    </div>
  `,
})
export default class BattlesComponent {
  private readonly battleService = inject(BattleService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Swords = Swords;
  protected readonly filters = FILTERS;

  protected readonly user = this.auth.user;
  protected readonly filter = signal<BattleFilter>('all');

  protected readonly resource = rxResource({
    stream: () => this.battleService.myBattles({ limit: 200, offset: 0 }),
  });

  protected readonly all = computed<Battle[]>(() => this.resource.value()?.items ?? []);

  protected readonly filtered = computed<Battle[]>(() => {
    const me = this.user()?.id;
    const f = this.filter();
    return this.all().filter((b) => {
      switch (f) {
        case 'wins':
          return b.winner_id === me;
        case 'losses':
          return b.winner_id !== null && b.winner_id !== me;
        case 'attacker':
          return b.attacker_id === me;
        case 'defender':
          return b.defender_id === me;
        case 'captures':
          return b.territory_captured;
        default:
          return true;
      }
    });
  });

  protected filterClass(value: BattleFilter): string {
    const active = this.filter() === value;
    return `px-3 h-8 text-xs font-medium ${
      active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  protected open(b: Battle): void {
    void this.router.navigate(['/battles', b.id]);
  }

  protected reload(): void {
    this.resource.reload();
  }
}
