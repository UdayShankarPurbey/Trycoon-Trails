import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ResourceKind } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

const KINDS: { value: ResourceKind; label: string }[] = [
  { value: 'coins', label: 'Coins' },
  { value: 'gems', label: 'Gems' },
  { value: 'manpower', label: 'Manpower' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'xp', label: 'XP' },
];

@Component({
  selector: 'tt-grant-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Grant resource to ' + data.username">
      <form [formGroup]="form" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Resource</label>
          <select formControlName="kind" class="w-full h-10 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100">
            @for (k of kinds; track k.value) {
              <option [value]="k.value">{{ k.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Amount</label>
          <input
            type="number"
            formControlName="amount"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <p class="text-[11px] text-zinc-500 mt-1">Negative values to deduct.</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reason (optional)</label>
          <input
            type="text"
            formControlName="reason"
            placeholder="e.g. compensation, prize"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
      </form>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button size="sm" [loading]="loading()" [disabled]="form.invalid" (clicked)="confirm()">
          Grant
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class GrantDialogComponent {
  protected readonly data = inject<{ userId: string; username: string }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly kinds = KINDS;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    kind: ['coins' as ResourceKind, Validators.required],
    amount: [100, [Validators.required]],
    reason: [''],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading()) return;
    const { kind, amount, reason } = this.form.getRawValue();
    if (!Number.isFinite(Number(amount)) || Number(amount) === 0) return;
    this.loading.set(true);
    this.admin.grantToPlayer(this.data.userId, { kind, amount: Number(amount), reason: reason || undefined }).subscribe({
      next: (u) => {
        this.toast.success(`Granted ${amount} ${kind}`, `Player ${u.username} updated`);
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Grant failed', err.message);
      },
    });
  }
}
