import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Target } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { MissionService } from '../../../core/services/mission.service';
import { ToastService } from '../../../core/services/toast.service';
import { MissionItem } from '../../../core/types';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { MissionCardComponent } from '../../missions/components/mission-card';

@Component({
  selector: 'tt-active-missions-card',
  imports: [CardComponent, EmptyStateComponent, SpinnerComponent, MissionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Active missions" subtitle="Closest to completion">
      @if (resource.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (top().length === 0) {
        <tt-empty-state
          [icon]="Target"
          title="No active missions"
          description="All caught up — new daily missions reset at midnight UTC." />
      } @else {
        <div class="space-y-2.5">
          @for (m of top(); track m.id) {
            <tt-mission-card
              [mission]="m"
              [compact]="true"
              [claiming]="claimingId() === m.id"
              (claim)="claim(m)" />
          }
        </div>
      }
    </tt-card>
  `,
})
export class ActiveMissionsCardComponent {
  private readonly missionService = inject(MissionService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly Target = Target;

  protected readonly resource = rxResource({ stream: () => this.missionService.list() });
  protected readonly claimingId = signal<number | null>(null);

  protected readonly top = computed<MissionItem[]>(() => {
    const items = this.resource.value()?.items ?? [];
    return items
      .filter((m) => !m.claimed)
      .sort((a, b) => {
        const ap = a.completed ? 1 : a.progress / a.goal_value;
        const bp = b.completed ? 1 : b.progress / b.goal_value;
        return bp - ap;
      })
      .slice(0, 4);
  });

  protected claim(m: MissionItem): void {
    if (this.claimingId() !== null) return;
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
}
