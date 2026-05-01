import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Pencil, PowerOff, RefreshCw } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { BusinessType } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { FormatNumberPipe } from '../../shared/pipes/format-number.pipe';
import { BusinessTypeFormDialogComponent } from './dialogs/business-type-form-dialog';

@Component({
  selector: 'tt-admin-business-types',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, SpinnerComponent, LucideAngularModule,
    FormatNumberPipe,
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
          New type
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
                  <th class="text-right py-2 px-2 font-medium">Cost</th>
                  <th class="text-right py-2 px-2 font-medium">Income/min</th>
                  <th class="text-right py-2 px-2 font-medium">Cost ×</th>
                  <th class="text-right py-2 px-2 font-medium">Inc ×</th>
                  <th class="text-right py-2 px-2 font-medium">Unlock</th>
                  <th class="text-left py-2 px-2 font-medium">Status</th>
                  <th class="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (t of types(); track t.id) {
                  <tr class="border-b border-zinc-800/50 last:border-0">
                    <td class="py-2 px-2 text-zinc-500 font-mono text-xs">{{ t.code }}</td>
                    <td class="py-2 px-2 font-medium">{{ t.name }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-amber-300">{{ t.base_cost | ttFormatNumber }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ t.base_income_per_min }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-xs">×{{ t.upgrade_cost_multiplier }}</td>
                    <td class="py-2 px-2 text-right tabular-nums text-xs">×{{ t.upgrade_income_multiplier }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ t.unlock_level }}</td>
                    <td class="py-2 px-2">
                      <tt-badge [variant]="t.is_active ? 'success' : 'default'">
                        {{ t.is_active ? 'active' : 'inactive' }}
                      </tt-badge>
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="inline-flex items-center gap-1">
                        <tt-button size="sm" variant="ghost" (clicked)="edit(t)">
                          <lucide-angular [img]="Pencil" [size]="13" />
                        </tt-button>
                        @if (t.is_active) {
                          <tt-button size="sm" variant="ghost" (clicked)="deactivate(t)">
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
export default class AdminBusinessTypesComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Plus = Plus;
  protected readonly Pencil = Pencil;
  protected readonly PowerOff = PowerOff;
  protected readonly RefreshCw = RefreshCw;

  protected readonly resource = rxResource({ stream: () => this.admin.listBusinessTypes() });
  protected readonly types = computed<BusinessType[]>(() => this.resource.value()?.types ?? []);

  protected reload(): void {
    this.resource.reload();
  }

  protected create(): void {
    const ref = this.dialog.open(BusinessTypeFormDialogComponent, {
      data: {}, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected edit(t: BusinessType): void {
    const ref = this.dialog.open(BusinessTypeFormDialogComponent, {
      data: { type: t }, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected deactivate(t: BusinessType): void {
    this.admin.deactivateBusinessType(t.id).subscribe({
      next: () => {
        this.toast.success(`Deactivated: ${t.name}`);
        this.resource.reload();
      },
      error: (err: ApiError) => this.toast.error('Deactivate failed', err.message),
    });
  }
}
