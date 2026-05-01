import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/services/api.service';
import { AdminMission, AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

const INPUT = 'w-full h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500';

@Component({
  selector: 'tt-mission-form-dialog',
  imports: [DialogShellComponent, ButtonComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="data.mission ? 'Edit mission' : 'Create mission'">
      <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Code</label>
          <input type="text" formControlName="code" [class]="input" [readonly]="!!data.mission" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Title</label>
          <input type="text" formControlName="title" [class]="input" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-medium text-zinc-300 mb-1">Description</label>
          <textarea rows="2" formControlName="description" [class]="textarea"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Type</label>
          <select formControlName="type" [class]="input">
            <option value="daily">daily</option>
            <option value="story">story</option>
            <option value="achievement">achievement</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Goal type</label>
          <select formControlName="goal_type" [class]="input">
            <option value="buy_business">buy_business</option>
            <option value="upgrade_business">upgrade_business</option>
            <option value="recruit_units">recruit_units</option>
            <option value="win_battle">win_battle</option>
            <option value="capture_territory">capture_territory</option>
            <option value="reach_level">reach_level</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Goal mode</label>
          <select formControlName="goal_mode" [class]="input">
            <option value="add">add</option>
            <option value="max">max</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Goal value</label>
          <input type="number" formControlName="goal_value" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reward coins</label>
          <input type="number" formControlName="reward_coins" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reward gems</label>
          <input type="number" formControlName="reward_gems" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Reward XP</label>
          <input type="number" formControlName="reward_xp" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Required level</label>
          <input type="number" min="1" formControlName="required_level" [class]="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-300 mb-1">Sort order</label>
          <input type="number" formControlName="sort_order" [class]="input" />
        </div>
        <label class="col-span-2 inline-flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" formControlName="is_active" class="accent-amber-500" />
          Active
        </label>
      </form>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button size="sm" [loading]="loading()" [disabled]="form.invalid" (clicked)="confirm()">
          {{ data.mission ? 'Save' : 'Create' }}
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class MissionFormDialogComponent {
  protected readonly data = inject<{ mission?: AdminMission }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly input = INPUT;
  protected readonly textarea = INPUT.replace('h-9 px-2', 'px-2 py-1.5');
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    code: [this.data.mission?.code ?? '', [Validators.required, Validators.maxLength(64)]],
    title: [this.data.mission?.title ?? '', [Validators.required, Validators.maxLength(128)]],
    description: [this.data.mission?.description ?? ''],
    type: [this.data.mission?.type ?? 'daily', Validators.required],
    goal_type: [this.data.mission?.goal_type ?? 'buy_business', Validators.required],
    goal_mode: [this.data.mission?.goal_mode ?? 'add', Validators.required],
    goal_value: [this.data.mission?.goal_value ?? 1, [Validators.required, Validators.min(1)]],
    reward_coins: [this.data.mission?.reward_coins ?? 0, [Validators.required, Validators.min(0)]],
    reward_gems: [this.data.mission?.reward_gems ?? 0, [Validators.required, Validators.min(0)]],
    reward_xp: [this.data.mission?.reward_xp ?? 0, [Validators.required, Validators.min(0)]],
    required_level: [this.data.mission?.required_level ?? 1, [Validators.required, Validators.min(1)]],
    sort_order: [this.data.mission?.sort_order ?? 100, [Validators.required, Validators.min(0)]],
    is_active: [this.data.mission?.is_active ?? true],
  });

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading() || this.form.invalid) return;
    const payload = this.form.getRawValue();
    this.loading.set(true);
    const obs = this.data.mission
      ? this.admin.updateMission(this.data.mission.id, payload)
      : this.admin.createMission(payload);
    obs.subscribe({
      next: () => {
        this.toast.success(this.data.mission ? 'Mission updated' : 'Mission created');
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Save failed', err.message);
      },
    });
  }
}
