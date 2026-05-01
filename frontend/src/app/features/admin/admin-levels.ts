import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Pencil, RefreshCw } from 'lucide-angular';
import { AdminService } from '../../core/services/admin.service';
import { Level } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { LevelFormDialogComponent } from './dialogs/level-form-dialog';

@Component({
  selector: 'tt-admin-levels',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex justify-end">
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
        </tt-button>
      </div>
      @if (resource.isLoading()) {
        <tt-card><div class="flex justify-center py-8"><tt-spinner /></div></tt-card>
      } @else {
        <tt-card padding="sm">
          <ul class="space-y-1.5">
            @for (l of levels(); track l.level) {
              <li class="flex items-center gap-3 p-2 rounded-md border border-zinc-800">
                <span class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/15 text-amber-300 border border-amber-600/30 text-sm font-bold">
                  L{{ l.level }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ l.title }}</p>
                  <p class="text-[11px] text-zinc-500">
                    XP req: {{ l.xp_required }} ·
                    Reward: {{ l.reward_coins }}c
                    @if (l.reward_gems) { + {{ l.reward_gems }}g }
                  </p>
                  @if (l.unlocks?.length) {
                    <div class="flex flex-wrap gap-1 mt-1">
                      @for (u of l.unlocks; track u) {
                        <tt-badge variant="default">{{ u }}</tt-badge>
                      }
                    </div>
                  }
                </div>
                <tt-button size="sm" variant="ghost" (clicked)="edit(l)">
                  <lucide-angular [img]="Pencil" [size]="13" />
                </tt-button>
              </li>
            }
          </ul>
        </tt-card>
      }
    </div>
  `,
})
export default class AdminLevelsComponent {
  private readonly admin = inject(AdminService);
  private readonly dialog = inject(Dialog);

  protected readonly Pencil = Pencil;
  protected readonly RefreshCw = RefreshCw;

  protected readonly resource = rxResource({ stream: () => this.admin.listLevels() });
  protected readonly levels = computed<Level[]>(() => this.resource.value()?.levels ?? []);

  protected reload(): void {
    this.resource.reload();
  }

  protected edit(l: Level): void {
    const ref = this.dialog.open(LevelFormDialogComponent, {
      data: { level: l }, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }
}
