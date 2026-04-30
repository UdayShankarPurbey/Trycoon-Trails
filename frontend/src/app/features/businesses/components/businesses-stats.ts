import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Building2, Coins, Hammer, Inbox } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { StatTileComponent } from '../../../shared/ui/stat-tile/stat-tile';
import { FormatNumberPipe } from '../../../shared/pipes/format-number.pipe';

export interface BusinessAggregate {
  count: number;
  perMinute: number;
  uncollected: number;
  totalUpgradeCost: number;
}

@Component({
  selector: 'tt-businesses-stats',
  imports: [StatTileComponent, ButtonComponent, LucideAngularModule, FormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <tt-stat-tile
          label="Total businesses"
          [value]="agg().count"
          [icon]="Building2"
          accent="bg-amber-500/15 text-amber-300" />
        <tt-stat-tile
          label="Income / min"
          [value]="agg().perMinute"
          [icon]="Coins"
          accent="bg-emerald-500/15 text-emerald-300" />
        <tt-stat-tile
          label="Uncollected"
          [value]="agg().uncollected"
          [icon]="Inbox"
          accent="bg-cyan-500/15 text-cyan-300" />
        <tt-stat-tile
          label="Total upgrade cost"
          [value]="agg().totalUpgradeCost"
          [icon]="Hammer"
          accent="bg-violet-500/15 text-violet-300" />
      </div>
      @if (agg().uncollected > 0) {
        <div class="flex justify-end">
          <tt-button [loading]="collecting()" (clicked)="collectAllClicked.emit()">
            <lucide-angular [img]="Coins" [size]="14" />
            Collect all ({{ agg().uncollected | ttFormatNumber }} coins)
          </tt-button>
        </div>
      }
    </div>
  `,
})
export class BusinessesStatsComponent {
  readonly agg = input.required<BusinessAggregate>();
  readonly collecting = input<boolean>(false);

  readonly collectAllClicked = output<void>();

  protected readonly Building2 = Building2;
  protected readonly Coins = Coins;
  protected readonly Hammer = Hammer;
  protected readonly Inbox = Inbox;
}
