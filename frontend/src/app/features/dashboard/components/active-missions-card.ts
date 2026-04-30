import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Target, CheckCircle2 } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { MissionService } from '../../../core/services/mission.service';
import { ToastService } from '../../../core/services/toast.service';
import { MissionItem } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'tt-active-missions-card',
  imports: [
    CardComponent, BadgeComponent, ButtonComponent,
    EmptyStateComponent, ProgressBarComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Active missions" subtitle="Closest to completion">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (top().length === 0) {
        <tt-empty-state [icon]="Target" title="No active missions" description="All caught up — new daily missions reset at midnight UTC." />
      } @else {
        <ul class="space-y-3">
          @for (m of top(); track m.id) {
            <li class="rounded-md border border-zinc-800 p-3">
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-2 min-w-0">
                  <p class="text-sm font-medium truncate">{{ m.title }}</p>
                  <tt-badge [variant]="badgeVariant(m)">{{ m.type }}</tt-badge>
                </div>
                @if (m.completed && !m.claimed) {
                  <tt-button size="sm" (clicked)="claim(m)" [loading]="claimingId() === m.id">
                    Claim
                  </tt-button>
                } @else if (m.claimed) {
                  <span class="inline-flex items-center gap-1 text-xs text-emerald-300">
                    <lucide-angular [img]="CheckCircle2" [size]="14" />
                    Claimed
                  </span>
                }
              </div>
              <tt-progress-bar [value]="m.progress" [max]="m.goal_value" [showValue]="true" />
              <p class="text-[11px] text-zinc-500 mt-1">
                Reward:
                <span class="text-amber-300">{{ m.rewards.coins }}c</span>
                @if (m.rewards.gems) { + <span class="text-cyan-300">{{ m.rewards.gems }}g</span> }
                @if (m.rewards.xp) { + <span class="text-violet-300">{{ m.rewards.xp }}xp</span> }
              </p>
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class ActiveMissionsCardComponent {
  private readonly missionService = inject(MissionService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly Target = Target;
  protected readonly CheckCircle2 = CheckCircle2;

  protected readonly resource = rxResource({ stream: () => this.missionService.list() });
  protected readonly claimingId = signal<number | null>(null);

  protected readonly top = computed<MissionItem[]>(() => {
    const items = this.resource.value()?.items ?? [];
    const active = items
      .filter((m) => !m.claimed)
      .sort((a, b) => {
        const ap = a.completed ? 1 : a.progress / a.goal_value;
        const bp = b.completed ? 1 : b.progress / b.goal_value;
        return bp - ap;
      });
    return active.slice(0, 4);
  });

  protected badgeVariant(m: MissionItem): 'gold' | 'info' | 'success' {
    return m.type === 'daily' ? 'gold' : m.type === 'achievement' ? 'success' : 'info';
  }

  protected claim(m: MissionItem): void {
    if (this.claimingId() !== null) return;
    this.claimingId.set(m.id);
    this.missionService.claim(m.id).subscribe({
      next: (res) => {
        this.claimingId.set(null);
        const u = this.auth.user();
        if (u) {
          this.auth.setUser({ ...u, ...res.balances });
        }
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
}
