import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Territory } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

const INPUT = 'w-full h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500';

@Component({
  selector: 'tt-territory-form-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Edit tile (' + data.tile.x + ',' + data.tile.y + ')'">
      <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Name</label>
          <input type="text" formControlName="name" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Terrain</label>
          <select formControlName="terrain" [class]="input">
            <option value="plains">plains</option>
            <option value="forest">forest</option>
            <option value="mountain">mountain</option>
            <option value="coast">coast</option>
            <option value="desert">desert</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Capacity</label>
          <input type="number" min="1" formControlName="business_capacity" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Defense bonus</label>
          <input type="number" min="0" formControlName="defense_bonus" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Income multiplier</label>
          <input type="number" step="0.05" min="0.1" formControlName="income_multiplier" [class]="input" />
        </div>
      </form>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button size="sm" [loading]="loading()" [disabled]="form.invalid" (clicked)="confirm()">
          Save
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class TerritoryFormDialogComponent {
  protected readonly data = inject<{ tile: Territory }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly input = INPUT;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.tile.name, [Validators.required, Validators.maxLength(64)]],
    terrain: [this.data.tile.terrain, Validators.required],
    business_capacity: [this.data.tile.business_capacity, [Validators.required, Validators.min(1)]],
    defense_bonus: [this.data.tile.defense_bonus, [Validators.required, Validators.min(0)]],
    income_multiplier: [Number(this.data.tile.income_multiplier), [Validators.required, Validators.min(0.1)]],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading() || this.form.invalid) return;
    const payload = this.form.getRawValue();
    this.loading.set(true);
    this.admin.updateTerritory(this.data.tile.id, payload).subscribe({
      next: () => {
        this.toast.success('Tile updated');
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Save failed', err.message);
      },
    });
  }
}
