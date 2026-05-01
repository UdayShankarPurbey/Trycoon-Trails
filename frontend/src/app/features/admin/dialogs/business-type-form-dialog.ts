import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessType } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

const INPUT = 'w-full h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500';

@Component({
  selector: 'tt-business-type-form-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="data.type ? 'Edit business type' : 'Create business type'">
      <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Code</label>
          <input type="text" formControlName="code" [class]="input" [readonly]="!!data.type" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Name</label>
          <input type="text" formControlName="name" [class]="input" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Description</label>
          <input type="text" formControlName="description" [class]="input" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Image URL</label>
          <input type="text" formControlName="image_url" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Base cost</label>
          <input type="number" min="1" formControlName="base_cost" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Income per minute</label>
          <input type="number" min="0" formControlName="base_income_per_min" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Upgrade cost ×</label>
          <input type="number" step="0.1" min="1" formControlName="upgrade_cost_multiplier" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Upgrade income ×</label>
          <input type="number" step="0.1" min="1" formControlName="upgrade_income_multiplier" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Unlock level</label>
          <input type="number" min="1" formControlName="unlock_level" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Max level</label>
          <input type="number" min="1" formControlName="max_level" [class]="input" />
        </div>
        <label class="col-span-2 inline-flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" formControlName="is_active" class="accent-amber-500" />
          Active
        </label>
      </form>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button size="sm" [loading]="loading()" [disabled]="form.invalid" (clicked)="confirm()">
          {{ data.type ? 'Save' : 'Create' }}
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class BusinessTypeFormDialogComponent {
  protected readonly data = inject<{ type?: BusinessType }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly input = INPUT;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    code: [this.data.type?.code ?? '', [Validators.required, Validators.maxLength(32)]],
    name: [this.data.type?.name ?? '', [Validators.required, Validators.maxLength(64)]],
    description: [this.data.type?.description ?? ''],
    image_url: [this.data.type?.image_url ?? ''],
    base_cost: [Number(this.data.type?.base_cost ?? 100), [Validators.required, Validators.min(1)]],
    base_income_per_min: [Number(this.data.type?.base_income_per_min ?? 5), [Validators.required, Validators.min(0)]],
    upgrade_cost_multiplier: [Number(this.data.type?.upgrade_cost_multiplier ?? 1.5), [Validators.required, Validators.min(1)]],
    upgrade_income_multiplier: [Number(this.data.type?.upgrade_income_multiplier ?? 1.4), [Validators.required, Validators.min(1)]],
    unlock_level: [this.data.type?.unlock_level ?? 1, [Validators.required, Validators.min(1)]],
    max_level: [this.data.type?.max_level ?? 10, [Validators.required, Validators.min(1)]],
    is_active: [this.data.type?.is_active ?? true],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading() || this.form.invalid) return;
    const payload = this.form.getRawValue();
    this.loading.set(true);
    const obs = this.data.type
      ? this.admin.updateBusinessType(this.data.type.id, payload)
      : this.admin.createBusinessType(payload);
    obs.subscribe({
      next: () => {
        this.toast.success(this.data.type ? 'Business type updated' : 'Business type created');
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Save failed', err.message);
      },
    });
  }
}
