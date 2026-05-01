import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { LucideAngularModule, KeyRound } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';

const matchPasswords: ValidatorFn = (group: AbstractControl) => {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmPassword')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
};

@Component({
  selector: 'tt-profile-security-card',
  imports: [ReactiveFormsModule, ButtonComponent, CardComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Security" subtitle="Change your password">
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label for="current" class="block text-xs font-medium text-zinc-300 mb-1">Current password</label>
          <input
            id="current"
            type="password"
            autocomplete="current-password"
            formControlName="currentPassword"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label for="new" class="block text-xs font-medium text-zinc-300 mb-1">New password</label>
          <input
            id="new"
            type="password"
            autocomplete="new-password"
            formControlName="newPassword"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <p class="text-[11px] text-zinc-500 mt-1">8–72 chars, must contain letters and digits.</p>
        </div>
        <div>
          <label for="confirm" class="block text-xs font-medium text-zinc-300 mb-1">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            autocomplete="new-password"
            formControlName="confirmPassword"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
            <p class="text-[11px] text-red-300 mt-1">Passwords do not match.</p>
          }
        </div>
        <div class="flex justify-end">
          <tt-button type="submit" size="sm" [loading]="saving()" [disabled]="form.invalid">
            <lucide-angular [img]="KeyRound" [size]="14" />
            Change password
          </tt-button>
        </div>
      </form>
    </tt-card>
  `,
})
export class ProfileSecurityCardComponent {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly KeyRound = KeyRound;
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.toast.success('Password changed', 'Use your new password next time you log in.');
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error('Change password failed', err.message);
      },
    });
  }
}
