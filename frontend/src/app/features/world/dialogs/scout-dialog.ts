import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideAngularModule, ShieldAlert, ShieldCheck } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { BattleService } from '../../../core/services/battle.service';
import { ToastService } from '../../../core/services/toast.service';
import { ScoutReport } from '../../../core/types';
import { DialogShellComponent } from '../../../shared/ui/dialog-shell/dialog-shell';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'tt-scout-dialog',
  imports: [DialogShellComponent, ButtonComponent, SpinnerComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-dialog-shell [title]="'Scout (' + data.x + ', ' + data.y + ')'">
      @if (loading()) {
        <div class="flex flex-col items-center gap-3 py-8 text-zinc-400">
          <tt-spinner />
          <p class="text-xs">Sending scouts… (50 coins)</p>
        </div>
      } @else if (report(); as r) {
        <div class="space-y-4">
          <div class="rounded-md border border-zinc-800 p-3">
            <p class="text-[11px] uppercase tracking-wide text-zinc-500">Defender</p>
            <p class="text-sm">
              {{ r.owner?.username ?? 'Unowned' }}
              @if (r.owner) {
                <span class="text-zinc-500 text-xs ml-1">L{{ r.owner.level }} · rep {{ r.owner.reputation }}</span>
              }
            </p>
            @if (r.owner?.shield_until) {
              <p class="text-xs text-emerald-300 inline-flex items-center gap-1 mt-1">
                <lucide-angular [img]="ShieldCheck" [size]="12" />
                Under new-player shield
              </p>
            }
          </div>

          <div class="rounded-md border border-zinc-800 p-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Army strength (defense)</p>
              <span class="text-sm font-semibold inline-flex items-center gap-1.5 text-rose-300">
                <lucide-angular [img]="ShieldAlert" [size]="14" />
                {{ r.defender_strength }}
              </span>
            </div>
            @if (r.armies.length === 0) {
              <p class="text-sm text-zinc-400">No defenders stationed.</p>
            } @else {
              <ul class="space-y-1 text-sm">
                @for (a of r.armies; track a.unit_type.id) {
                  <li class="flex items-center justify-between">
                    <span class="text-zinc-200">{{ a.unit_type.name }} <span class="text-zinc-500 text-xs">(atk {{ a.unit_type.attack }} / def {{ a.unit_type.defense }})</span></span>
                    <span class="tabular-nums text-zinc-300">×{{ a.count }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
      <div dialog-footer>
        <tt-button variant="ghost" size="sm" (clicked)="close()">Close</tt-button>
      </div>
    </tt-dialog-shell>
  `,
})
export class ScoutDialogComponent {
  protected readonly data = inject<{ territoryId: string; x: number; y: number }>(DIALOG_DATA);
  private readonly dialogRef = inject(DialogRef);
  private readonly battles = inject(BattleService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly report = signal<ScoutReport | null>(null);

  protected readonly ShieldAlert = ShieldAlert;
  protected readonly ShieldCheck = ShieldCheck;

  constructor() {
    this.battles.scout(this.data.territoryId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.report.set(res);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Scout failed', err.message);
        this.dialogRef.close();
      },
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
