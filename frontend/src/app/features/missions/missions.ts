import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, RefreshCw, Target } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MissionService } from '../../core/services/mission.service';
import { ToastService } from '../../core/services/toast.service';
import { MissionItem, MissionType } from '../../core/types';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { MissionCardComponent } from './components/mission-card';

type TabKey = 'all' | MissionType;

const TABS: { value: TabKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'story', label: 'Story' },
  { value: 'achievement', label: 'Achievements' },
];

@Component({
  selector: 'tt-missions',
  imports: [
    MissionCardComponent, CardComponent, EmptyStateComponent, SpinnerComponent,
    ButtonComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-4xl">
      <header class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-xl font-semibold">Missions</h2>
          <p class="text-sm text-zinc-400">Daily resets at midnight UTC.</p>
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </header>

      <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden flex-wrap">
        @for (t of tabs; track t.value) {
          <button type="button" (click)="tab.set(t.value)" [class]="tabClass(t.value)">
            {{ t.label }}
            @if (countFor(t.value); as n) {
              @if (n > 0) {
                <span class="ml-1.5 text-[10px] tabular-nums opacity-70">{{ n }}</span>
              }
            }
          </button>
        }
      </div>

      @if (resource.isLoading() && all().length === 0) {
        <tt-card>
          <div class="flex justify-center py-10"><tt-spinner /></div>
        </tt-card>
      } @else if (filtered().length === 0) {
        <tt-card>
          <tt-empty-state
            [icon]="Target"
            title="No missions in this tab"
            description="Try a different tab — or come back tomorrow for new dailies." />
        </tt-card>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (m of filtered(); track m.id) {
            <tt-mission-card
              [mission]="m"
              [claiming]="claimingId() === m.id"
              (claim)="claim(m)" />
          }
        </div>
      }
    </div>
  `,
})
export default class MissionsComponent {
  private readonly missionService = inject(MissionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Target = Target;
  protected readonly tabs = TABS;

  protected readonly tab = signal<TabKey>('all');
  protected readonly claimingId = signal<number | null>(null);

  protected readonly resource = rxResource({ stream: () => this.missionService.list() });

  protected readonly all = computed<MissionItem[]>(() => this.resource.value()?.items ?? []);

  protected readonly filtered = computed<MissionItem[]>(() => {
    const t = this.tab();
    return t === 'all' ? this.all() : this.all().filter((m) => m.type === t);
  });

  protected countFor(tab: TabKey): number {
    if (tab === 'all') return this.all().filter((m) => !m.claimed).length;
    return this.all().filter((m) => m.type === tab && !m.claimed).length;
  }

  protected tabClass(value: TabKey): string {
    const active = this.tab() === value;
    return `px-3 h-8 text-xs font-medium ${
      active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  protected claim(m: MissionItem): void {
    if (this.claimingId()) return;
    this.claimingId.set(m.id);
    this.missionService.claim(m.id).subscribe({
      next: (res) => {
        this.claimingId.set(null);
        const u = this.auth.user();
        if (u) this.auth.setUser({ ...u, ...res.balances });
        this.toast.success(
          `Claimed: ${m.title}`,
          `+${res.rewards.coins}c +${res.rewards.gems}g +${res.rewards.xp}xp`,
        );
        this.resource.reload();
      },
      error: (err: ApiError) => {
        this.claimingId.set(null);
        this.toast.error('Claim failed', err.message);
      },
    });
  }

  protected reload(): void {
    this.resource.reload();
  }
}
