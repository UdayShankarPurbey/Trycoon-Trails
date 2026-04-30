import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, MapPin, Plus } from 'lucide-angular';
import { Territory } from '../../../core/types';
import { TERRAIN_STYLES } from '../../world/world-utils';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';

export interface TerritorySlots {
  territory: Territory;
  used: number;
  capacity: number;
}

@Component({
  selector: 'tt-territory-slots-card',
  imports: [CardComponent, BadgeComponent, ButtonComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Your territories" subtitle="Click + to add a business to a territory">
      @if (slots().length === 0) {
        <p class="text-sm text-zinc-400">You don't own any territory yet.</p>
      } @else {
        <ul class="space-y-1.5">
          @for (s of slots(); track s.territory.id) {
            <li class="flex items-center justify-between gap-3 p-2 rounded-md border border-zinc-800">
              <div class="flex items-center gap-2 min-w-0">
                <span [class]="dot(s.territory.terrain)"></span>
                <p class="text-sm font-medium truncate">{{ s.territory.name }}</p>
                <span class="text-[11px] text-zinc-500">
                  ({{ s.territory.x }},{{ s.territory.y }})
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <tt-badge [variant]="s.used >= s.capacity ? 'danger' : 'default'">
                  {{ s.used }}/{{ s.capacity }}
                </tt-badge>
                <tt-button
                  size="sm"
                  variant="ghost"
                  [disabled]="s.used >= s.capacity"
                  (clicked)="buyOnTerritory.emit(s)">
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
export class TerritorySlotsCardComponent {
  readonly slots = input.required<TerritorySlots[]>();
  readonly buyOnTerritory = output<TerritorySlots>();

  protected readonly MapPin = MapPin;
  protected readonly Plus = Plus;

  protected dot(terrain: Territory['terrain']): string {
    return `inline-block w-2.5 h-2.5 rounded-full ${TERRAIN_STYLES[terrain].base}`;
  }
}
