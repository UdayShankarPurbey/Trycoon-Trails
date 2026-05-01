import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

@Component({
  selector: 'tt-ban-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Ban ' + data.username">
      <form [formGroup]="form">
        <label class="block text-xs font-medium text-zinc-300 mb-1">Reason</label>
        <textarea
          rows="3"
          formControlName="reason"
          placeholder="Visible to the user when they try to log in"
          class="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
      </form>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button variant="danger" size="sm" [loading]="loading()" [disabled]="form.invalid" (clicked)="confirm()">
          Ban player
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class BanDialogComponent {
  protected readonly data = inject<{ userId: string; username: string }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading() || this.form.invalid) return;
    this.loading.set(true);
    this.admin.banPlayer(this.data.userId, this.form.getRawValue().reason).subscribe({
      next: () => {
        this.toast.success(`Banned ${this.data.username}`);
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Ban failed', err.message);
      },
    });
  }
}
