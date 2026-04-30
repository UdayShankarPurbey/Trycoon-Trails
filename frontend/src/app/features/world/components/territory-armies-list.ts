import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Swords } from 'lucide-angular';
import { ArmyGroup } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { ArmyRowComponent } from '../../army/components/army-row';
import { DisbandDialogComponent } from '../../army/dialogs/disband-dialog';

@Component({
  selector: 'tt-territory-armies-list',
  imports: [
    CardComponent, EmptyStateComponent, ButtonComponent, LucideAngularModule,
    ArmyRowComponent,
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
            <tt-army-row
              [army]="a"
              [canManage]="canManage()"
              [loadingDisband]="disbandingId() === a.id"
              (disbandTriggered)="openDisband(a)" />
          }
        </ul>
      }
    </tt-card>
  `,
})
export class TerritoryArmiesListComponent {
  private readonly dialog = inject(Dialog);

  readonly armies = input.required<ArmyGroup[]>();
  readonly canManage = input<boolean>(false);

  readonly recruitClicked = output<void>();
  readonly changed = output<void>();

  protected readonly Swords = Swords;
  protected readonly disbandingId = signal<string | null>(null);

  protected openDisband(army: ArmyGroup): void {
    if (this.disbandingId()) return;
    this.disbandingId.set(army.id);
    const ref = this.dialog.open(DisbandDialogComponent, {
      data: {
        armyId: army.id,
        unitName: army.unit_type.name,
        manpowerCost: army.unit_type.manpower_cost,
        currentCount: army.count,
      },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((disbanded) => {
      this.disbandingId.set(null);
      if (disbanded) this.changed.emit();
    });
  }
}
