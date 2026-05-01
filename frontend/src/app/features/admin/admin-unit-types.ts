import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Pencil, PowerOff, RefreshCw } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { UnitType } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { UnitTypeFormDialogComponent } from './dialogs/unit-type-form-dialog';

@Component({
  selector: 'tt-admin-unit-types',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex justify-end gap-2">
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
        <tt-button size="sm" (clicked)="create()">
          <lucide-angular [img]="Plus" [size]="14" />
          New unit
        </tt-button>
      </div>
      @if (resource.isLoading()) {
        <tt-card><div class="flex justify-center py-8"><tt-spinner /></div></tt-card>
      } @else {
        <tt-card padding="sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-[11px] uppercase tracking-wide text-zinc-500">
                <tr class="border-b border-zinc-800">
                  <th class="text-left py-2 px-2 font-medium">Code</th>
                  <th class="text-left py-2 px-2 font-medium">Name</th>
                  <th class="text-left py-2 px-2 font-medium">Category</th>
                  <th class="text-right py-2 px-2 font-medium">Cost</th>
                  <th class="text-right py-2 px-2 font-medium">MP</th>
                  <th class="text-right py-2 px-2 font-medium">Atk</th>
                  <th class="text-right py-2 px-2 font-medium">Def</th>
                  <th class="text-right py-2 px-2 font-medium">Upkeep</th>
                  <th class="text-right py-2 px-2 font-medium">Unlock</th>
                  <th class="text-left py-2 px-2 font-medium">Status</th>
                  <th class="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of types(); track u.id) {
                  <tr class="border-b border-zinc-800/50 last:border-0">
                    <td class="py-2 px-2 text-zinc-500 font-mono text-xs">{{ u.code }}</td>
                    <td class="py-2 px-2 font-medium">{{ u.name }}</td>
                    <td class="py-2 px-2 text-zinc-400">{{ u.category }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-amber-300">{{ u.coin_cost }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-rose-300">{{ u.manpower_cost }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ u.attack }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ u.defense }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ u.upkeep_per_min }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ u.unlock_level }}</td>
                    <td class="py-2 px-2">
                      <tt-badge [variant]="u.is_active ? 'success' : 'default'">
                        {{ u.is_active ? 'active' : 'inactive' }}
                      </tt-badge>
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="inline-flex items-center gap-1">
                        <tt-button size="sm" variant="ghost" (clicked)="edit(u)">
                          <lucide-angular [img]="Pencil" [size]="13" />
                        </tt-button>
                        @if (u.is_active) {
                          <tt-button size="sm" variant="ghost" (clicked)="deactivate(u)">
                            <lucide-angular [img]="PowerOff" [size]="13" />
                          </tt-button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </tt-card>
      }
    </div>
  `,
})
export default class AdminUnitTypesComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Plus = Plus;
  protected readonly Pencil = Pencil;
  protected readonly PowerOff = PowerOff;
  protected readonly RefreshCw = RefreshCw;

  protected readonly resource = rxResource({ stream: () => this.admin.listUnitTypes() });
  protected readonly types = computed<UnitType[]>(() => this.resource.value()?.types ?? []);

  protected reload(): void {
    this.resource.reload();
  }

  protected create(): void {
    const ref = this.dialog.open(UnitTypeFormDialogComponent, {
      data: {}, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected edit(u: UnitType): void {
    const ref = this.dialog.open(UnitTypeFormDialogComponent, {
      data: { type: u }, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected deactivate(u: UnitType): void {
    this.admin.deactivateUnitType(u.id).subscribe({
      next: () => {
        this.toast.success(`Deactivated: ${u.name}`);
        this.resource.reload();
      },
      error: (err: ApiError) => this.toast.error('Deactivate failed', err.message),
    });
  }
}
