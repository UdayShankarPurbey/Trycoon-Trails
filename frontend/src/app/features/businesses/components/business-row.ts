import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, ArrowUpRight, Coins, MapPin } from 'lucide-angular';
import { MyBusiness } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

export type BusinessRowAction = 'collect' | 'upgrade';

@Component({
  selector: 'tt-business-row',
  imports: [BadgeComponent, ButtonComponent, LucideAngularModule, FormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li class="flex items-center justify-between gap-3 p-2.5 rounded-md border border-zinc-800">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm font-medium">{{ business().type.name }}</p>
          <tt-badge variant="default">L{{ business().level }}/{{ business().type.max_level }}</tt-badge>
          @if (showTerritory()) {
            <span class="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <lucide-angular [img]="MapPin" [size]="11" />
              ({{ business().territory.x }},{{ business().territory.y }})
            </span>
          }
        </div>
        <p class="text-[11px] text-zinc-500 mt-0.5">
          +{{ business().income.per_minute | ttFormatNumber }}/min · uncollected
          <span class="text-amber-300">{{ business().income.uncollected | ttFormatNumber }}c</span>
        </p>
      </div>
      @if (canManage()) {
        <div class="flex items-center gap-1.5 shrink-0">
          <tt-button
            size="sm"
            variant="ghost"
            [loading]="loadingAction() === 'collect'"
            [disabled]="business().income.uncollected === 0"
            (clicked)="actionTriggered.emit('collect')">
            <lucide-angular [img]="Coins" [size]="14" />
            Collect
          </tt-button>
          <tt-button
            size="sm"
            variant="secondary"
            [disabled]="atMax()"
            [loading]="loadingAction() === 'upgrade'"
            (clicked)="actionTriggered.emit('upgrade')">
            <lucide-angular [img]="ArrowUpRight" [size]="14" />
            {{ business().upgrade_cost | ttFormatNumber }}c
          </tt-button>
        </div>
      }
    </li>
  `,
})
export class BusinessRowComponent {
  readonly business = input.required<MyBusiness>();
  readonly canManage = input<boolean>(false);
  readonly showTerritory = input<boolean>(false);
  readonly loadingAction = input<BusinessRowAction | null>(null);

  readonly actionTriggered = output<BusinessRowAction>();

  protected readonly Coins = Coins;
  protected readonly ArrowUpRight = ArrowUpRight;
  protected readonly MapPin = MapPin;

  protected readonly atMax = computed(() => this.business().level >= this.business().type.max_level);
}
