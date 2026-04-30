import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, Plus, Users } from 'lucide-angular';
import { Territory } from '../../../core/types';
import { TERRAIN_STYLES } from '../../world/world-utils';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';

export interface ArmyTerritoryEntry {
  territory: Territory;
  unitCount: number;
}

@Component({
  selector: 'tt-army-territories-card',
  imports: [CardComponent, BadgeComponent, ButtonComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Recruit on" subtitle="Pick a territory to station new units">
      @if (entries().length === 0) {
        <p class="text-sm text-zinc-400">You don't own any territory yet.</p>
      } @else {
        <ul class="space-y-1.5">
          @for (e of entries(); track e.territory.id) {
            <li class="flex items-center justify-between gap-3 p-2 rounded-md border border-zinc-800">
              <div class="flex items-center gap-2 min-w-0">
                <span [class]="dot(e.territory.terrain)"></span>
                <p class="text-sm font-medium truncate">{{ e.territory.name }}</p>
                <span class="text-[11px] text-zinc-500">
                  ({{ e.territory.x }},{{ e.territory.y }})
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <tt-badge variant="default">
                  <lucide-angular [img]="Users" [size]="11" />
                  {{ e.unitCount }}
                </tt-badge>
                <tt-button size="sm" variant="ghost" (clicked)="recruitOn.emit(e)">
                  <lucide-angular [img]="Plus" [size]="14" />
                </tt-button>
              </div>
            </li>
          }
        </ul>
      }
    </tt-card>
  `,
})
export class ArmyTerritoriesCardComponent {
  readonly entries = input.required<ArmyTerritoryEntry[]>();
  readonly recruitOn = output<ArmyTerritoryEntry>();

  protected readonly Plus = Plus;
  protected readonly Users = Users;

  protected dot(terrain: Territory['terrain']): string {
    return `inline-block w-2.5 h-2.5 rounded-full ${TERRAIN_STYLES[terrain].base}`;
  }
}
