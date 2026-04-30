import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ApiError } from '../../../core/services/api.service';
import { ArmyService } from '../../../core/services/army.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';

interface DisbandDialogData {
  armyId: string;
  unitName: string;
  manpowerCost: number;
  currentCount: number;
}

@Component({
  selector: 'tt-disband-dialog',
  imports: [DialogShellComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Disband ' + data.unitName">
      <p class="text-sm text-zinc-400 mb-3">
        How many units to disband? You'll get back 50% of the manpower spent — no coin refund.
      </p>
      <label class="block text-xs text-zinc-300 mb-1">
        Count (max {{ data.currentCount }})
      </label>
      <input
        type="number"
        min="1"
        [max]="data.currentCount"
        [value]="count()"
        (input)="onCount($event)"
        class="w-32 h-9 px-2 rounded bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500" />
      <p class="text-[11px] text-zinc-500 mt-2">
        Manpower refund:
        <span class="text-rose-300">+{{ refund() }}</span>
      </p>
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="cancel()">Cancel</tt-button>
        <tt-button
          variant="danger"
          size="sm"
          [disabled]="count() < 1 || count() > data.currentCount"
          [loading]="loading()"
          (clicked)="confirm()">
          Disband {{ count() }}
        </tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class DisbandDialogComponent {
  protected readonly data = inject<DisbandDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly armyService = inject(ArmyService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly count = signal<number>(1);
  protected readonly loading = signal(false);

  protected readonly refund = computed(() =>
    Math.floor((this.data.manpowerCost * this.count()) / 2),
  );

  protected onCount(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const n = Math.max(1, Math.min(this.data.currentCount, parseInt(input.value, 10) || 1));
    this.count.set(n);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.armyService.disband(this.data.armyId, this.count()).subscribe({
      next: () => {
        const u = this.auth.user();
        if (u) {
          this.auth.setUser({ ...u, manpower: Number(u.manpower) + this.refund() });
        }
        this.toast.success(
          `Disbanded ${this.count()} ${this.data.unitName}`,
          `+${this.refund()} manpower`,
        );
        this.dialogRef.close(true);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Disband failed', err.message);
      },
    });
  }
}
