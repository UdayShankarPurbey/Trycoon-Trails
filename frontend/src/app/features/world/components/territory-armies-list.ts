import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Swords } from 'lucide-angular';
import { ArmyGroup } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'tt-territory-armies-list',
  imports: [
    CardComponent, EmptyStateComponent, BadgeComponent, ButtonComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Armies stationed here">
      <div card-actions>
        @if (canManage()) {
          <tt-button size="sm" (clicked)="recruitClicked.emit()">
            <lucide-angular [img]="Swords" [size]="14" />
            Recruit
          </tt-button>
        }
      </div>
      @if (armies().length === 0) {
        <tt-empty-state [icon]="Swords" title="No units stationed" />
      } @else {
        <ul class="space-y-2">
          @for (a of armies(); track a.id) {
            <li class="flex items-center justify-between p-2.5 rounded-md border border-zinc-800 text-sm">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium">{{ a.unit_type.name }}</p>
                  <tt-badge variant="default">{{ a.unit_type.category }}</tt-badge>
                </div>
                <p class="text-[11px] text-zinc-500">
                  atk {{ a.unit_type.attack }} · def {{ a.unit_type.defense }} · upkeep {{ a.upkeep_per_min_total }}c/min
                </p>
              </div>
              <span class="text-base font-semibold tabular-nums">×{{ a.count }}</span>
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class TerritoryArmiesListComponent {
  readonly armies = input.required<ArmyGroup[]>();
  readonly canManage = input<boolean>(false);

  readonly recruitClicked = output<void>();

  protected readonly Swords = Swords;
}
