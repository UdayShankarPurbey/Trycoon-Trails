import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Plus, Pencil, PowerOff, RefreshCw } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AdminMission, AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { MissionFormDialogComponent } from './dialogs/mission-form-dialog';

@Component({
  selector: 'tt-admin-missions',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-end gap-2">
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
        <tt-button size="sm" (clicked)="create()">
          <lucide-angular [img]="Plus" [size]="14" />
          New mission
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
                  <th class="text-left py-2 px-2 font-medium">Title</th>
                  <th class="text-left py-2 px-2 font-medium">Type</th>
                  <th class="text-left py-2 px-2 font-medium">Goal</th>
                  <th class="text-right py-2 px-2 font-medium">Reward</th>
                  <th class="text-right py-2 px-2 font-medium">Lvl</th>
                  <th class="text-left py-2 px-2 font-medium">Status</th>
                  <th class="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (m of missions(); track m.id) {
                  <tr class="border-b border-zinc-800/50 last:border-0">
                    <td class="py-2 px-2 text-zinc-500 font-mono text-xs">{{ m.code }}</td>
                    <td class="py-2 px-2 font-medium">{{ m.title }}</td>
                    <td class="py-2 px-2">
                      <tt-badge [variant]="typeBadge(m.type)">{{ m.type }}</tt-badge>
                    </td>
                    <td class="py-2 px-2 text-xs text-zinc-400">{{ m.goal_type }} ({{ m.goal_mode }}) ×{{ m.goal_value }}</td>
                    <td class="py-2 px-2 text-right text-xs">
                      {{ m.reward_coins }}c
                      @if (m.reward_gems) { · {{ m.reward_gems }}g }
                      @if (m.reward_xp) { · {{ m.reward_xp }}xp }
                    </td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ m.required_level }}</td>
                    <td class="py-2 px-2">
                      @if (m.is_active) {
                        <tt-badge variant="success">active</tt-badge>
                      } @else {
                        <tt-badge variant="default">inactive</tt-badge>
                      }
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="inline-flex items-center gap-1">
                        <tt-button size="sm" variant="ghost" (clicked)="edit(m)">
                          <lucide-angular [img]="Pencil" [size]="13" />
                        </tt-button>
                        @if (m.is_active) {
                          <tt-button size="sm" variant="ghost" (clicked)="deactivate(m)">
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
export default class AdminMissionsComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Plus = Plus;
  protected readonly Pencil = Pencil;
  protected readonly PowerOff = PowerOff;
  protected readonly RefreshCw = RefreshCw;

  protected readonly resource = rxResource({ stream: () => this.admin.listMissions() });
  protected readonly missions = computed<AdminMission[]>(() => this.resource.value()?.missions ?? []);

  protected typeBadge(type: AdminMission['type']): 'gold' | 'info' | 'success' {
    return type === 'daily' ? 'gold' : type === 'achievement' ? 'success' : 'info';
  }

  protected reload(): void {
    this.resource.reload();
  }

  protected create(): void {
    const ref = this.dialog.open(MissionFormDialogComponent, {
      data: {},
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected edit(m: AdminMission): void {
    const ref = this.dialog.open(MissionFormDialogComponent, {
      data: { mission: m },
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected deactivate(m: AdminMission): void {
    this.admin.deactivateMission(m.id).subscribe({
      next: () => {
        this.toast.success(`Deactivated: ${m.title}`);
        this.resource.reload();
      },
      error: (err: ApiError) => this.toast.error('Deactivate failed', err.message),
    });
  }
}
