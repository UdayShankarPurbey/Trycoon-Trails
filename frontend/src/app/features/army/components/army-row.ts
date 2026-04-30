import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, MapPin, UserMinus } from 'lucide-angular';
import { ArmyGroup } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';

@Component({
  selector: 'tt-army-row',
  imports: [BadgeComponent, ButtonComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li class="flex items-center justify-between gap-3 p-2.5 rounded-md border border-zinc-800">
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm font-medium">{{ army().unit_type.name }}</p>
          <tt-badge variant="default">{{ army().unit_type.category }}</tt-badge>
          @if (showTerritory()) {
            <span class="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <lucide-angular [img]="MapPin" [size]="11" />
              ({{ army().territory.x }},{{ army().territory.y }})
            </span>
          }
        </div>
        <p class="text-[11px] text-zinc-500 mt-0.5">
          atk {{ army().unit_type.attack }} ·
          def {{ army().unit_type.defense }} ·
          upkeep {{ army().upkeep_per_min_total }}c/min
        </p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-base font-semibold tabular-nums">×{{ army().count }}</span>
        @if (canManage()) {
          <tt-button
            size="sm"
            variant="ghost"
            [loading]="loadingDisband()"
            (clicked)="disbandTriggered.emit()">
            <lucide-angular [img]="UserMinus" [size]="14" />
            Disband
          </tt-button>
        }
      </div>
    </li>
  `,
})
export class ArmyRowComponent {
  readonly army = input.required<ArmyGroup>();
  readonly canManage = input<boolean>(false);
  readonly showTerritory = input<boolean>(false);
  readonly loadingDisband = input<boolean>(false);

  readonly disbandTriggered = output<void>();

  protected readonly MapPin = MapPin;
  protected readonly UserMinus = UserMinus;
}
