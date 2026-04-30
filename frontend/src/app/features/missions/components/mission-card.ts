import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, CheckCircle2, Coins, Gem, Star } from 'lucide-angular';
import { MissionItem, MissionType } from '../../../core/types';
import { BadgeComponent, BadgeVariant } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar';

const TYPE_VARIANT: Record<MissionType, BadgeVariant> = {
  daily: 'gold',
  story: 'info',
  achievement: 'success',
};

@Component({
  selector: 'tt-mission-card',
  imports: [
    BadgeComponent, ButtonComponent, ProgressBarComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article [class]="rootClass()">
      <div class="flex items-start gap-2 mb-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-semibold truncate">{{ mission().title }}</h4>
            <tt-badge [variant]="typeVariant()">{{ mission().type }}</tt-badge>
            @if (mission().claimed) {
              <span class="inline-flex items-center gap-1 text-xs text-emerald-300">
                <lucide-angular [img]="CheckCircle2" [size]="12" />
                Claimed
              </span>
            }
          </div>
          @if (mission().description && !compact()) {
            <p class="text-xs text-zinc-400 mt-0.5">{{ mission().description }}</p>
          }
        </div>
        @if (mission().completed && !mission().claimed) {
          <tt-button size="sm" [loading]="claiming()" (clicked)="claim.emit()">
            Claim
          </tt-button>
        }
      </div>

      <tt-progress-bar
        [value]="mission().progress"
        [max]="mission().goal_value"
        [showValue]="true" />

      <div class="flex items-center gap-3 mt-2 text-[11px]">
        <span class="text-zinc-500">Reward:</span>
        @if (mission().rewards.coins) {
          <span class="inline-flex items-center gap-1 text-amber-300">
            <lucide-angular [img]="Coins" [size]="11" />
            {{ mission().rewards.coins }}
          </span>
        }
        @if (mission().rewards.gems) {
          <span class="inline-flex items-center gap-1 text-cyan-300">
            <lucide-angular [img]="Gem" [size]="11" />
            {{ mission().rewards.gems }}
          </span>
        }
        @if (mission().rewards.xp) {
          <span class="inline-flex items-center gap-1 text-violet-300">
            <lucide-angular [img]="Star" [size]="11" />
            {{ mission().rewards.xp }} xp
          </span>
        }
      </div>
    </article>
  `,
})
export class MissionCardComponent {
  readonly mission = input.required<MissionItem>();
  readonly claiming = input<boolean>(false);
  readonly compact = input<boolean>(false);

  readonly claim = output<void>();

  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly Coins = Coins;
  protected readonly Gem = Gem;
  protected readonly Star = Star;

  protected readonly typeVariant = computed<BadgeVariant>(() => TYPE_VARIANT[this.mission().type]);

  protected readonly rootClass = computed(() => {
    const m = this.mission();
    const claimed = m.claimed;
    const completed = m.completed && !claimed;
    return [
      'rounded-md border p-3',
      claimed ? 'border-zinc-800 bg-zinc-900/50 opacity-80' : completed ? 'border-amber-600/40 bg-amber-500/5' : 'border-zinc-800',
    ].join(' ');
  });
}
