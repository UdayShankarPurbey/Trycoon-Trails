import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Level } from '../../../core/types';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

const INPUT = 'w-full h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500';

@Component({
  selector: 'tt-level-form-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Edit level ' + data.level.level">
      <form [formGroup]="form" class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Title</label>
          <input type="text" formControlName="title" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">XP required</label>
          <input type="number" min="0" formControlName="xp_required" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reward coins</label>
          <input type="number" min="0" formControlName="reward_coins" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reward gems</label>
          <input type="number" min="0" formControlName="reward_gems" [class]="input" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Unlocks (comma separated)</label>
          <input type="text" formControlName="unlocks" [class]="input" />
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
export class LevelFormDialogComponent {
  protected readonly data = inject<{ level: Level }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly input = INPUT;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.level.title, [Validators.required, Validators.maxLength(64)]],
    xp_required: [this.data.level.xp_required, [Validators.required, Validators.min(0)]],
    reward_coins: [this.data.level.reward_coins, [Validators.required, Validators.min(0)]],
    reward_gems: [this.data.level.reward_gems, [Validators.required, Validators.min(0)]],
    unlocks: [(this.data.level.unlocks ?? []).join(', ')],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading() || this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      title: v.title,
      xp_required: v.xp_required,
      reward_coins: v.reward_coins,
      reward_gems: v.reward_gems,
      unlocks: v.unlocks
        ? v.unlocks.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
        : [],
    };
    this.loading.set(true);
    this.admin.updateLevel(this.data.level.level, payload).subscribe({
      next: () => {
        this.toast.success('Level updated');
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Save failed', err.message);
      },
    });
  }
}
