import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Award, Crown } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { LevelService } from '../../../core/services/level.service';
import { CardComponent } from '../../../shared/ui/card/card';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

@Component({
  selector: 'tt-level-progress-card',
  imports: [CardComponent, ProgressBarComponent, SpinnerComponent, LucideAngularModule, FormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card>
      @if (info.isLoading()) {
        <div class="flex justify-center py-6"><tt-spinner /></div>
      } @else if (info.value(); as v) {
        <div class="flex items-start gap-4">
          <span class="shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-600/30">
            <lucide-angular [img]="Crown" [size]="22" />
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <h3 class="text-lg font-semibold">{{ user()?.username }}</h3>
              <span class="text-xs text-zinc-400">L{{ v.level }} · {{ v.title }}</span>
            </div>
            @if (v.nextLevel) {
              <p class="text-xs text-zinc-400 mb-2">
                {{ v.xpToNext | ttFormatNumber }} XP to <span class="text-amber-300">{{ v.nextLevel.title }}</span>
              </p>
              <tt-progress-bar
                [value]="v.xp - v.xpAtCurrent"
                [max]="(v.xpForNext ?? v.xp) - v.xpAtCurrent" />
            } @else {
              <p class="text-xs text-emerald-300 inline-flex items-center gap-1">
                <lucide-angular [img]="Award" [size]="12" />
                Max level reached
              </p>
            }
            @if (v.unlocks.length) {
              <p class="mt-3 text-[11px] text-zinc-500">
                Unlocks: <span class="text-zinc-300">{{ unlocksLabel() }}</span>
              </p>
            }
          </div>
        </div>
      }
    </tt-card>
  `,
})
export class LevelProgressCardComponent {
  private readonly auth = inject(AuthService);
  private readonly levelService = inject(LevelService);

  protected readonly user = this.auth.user;
  protected readonly info = rxResource({ stream: () => this.levelService.me() });

  protected readonly Crown = Crown;
  protected readonly Award = Award;

  protected readonly unlocksLabel = computed(() =>
    (this.info.value()?.unlocks ?? []).map((u) => u.replace(/_/g, ' ')).join(', '),
  );
}
