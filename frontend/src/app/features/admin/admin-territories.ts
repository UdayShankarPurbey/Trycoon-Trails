import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Pencil, Eraser, RefreshCw } from 'lucide-angular';
import { ApiError } from '../../core/services/api.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { Territory } from '../../core/types';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { TERRAIN_STYLES } from '../world/world-utils';
import { TerritoryFormDialogComponent } from './dialogs/territory-form-dialog';

type FilterKey = 'all' | 'owned' | 'unowned';

const FILTERS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'owned', label: 'Owned' },
  { value: 'unowned', label: 'Unowned' },
];

@Component({
  selector: 'tt-admin-territories',
  imports: [
    BadgeComponent, ButtonComponent, CardComponent, SpinnerComponent, LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="inline-flex rounded-md border border-zinc-800 overflow-hidden">
          @for (f of filters; track f.value) {
            <button type="button" (click)="filter.set(f.value)" [class]="filterClass(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
        <tt-button variant="ghost" size="sm" (clicked)="reload()" [disabled]="resource.isLoading()">
          <lucide-angular [img]="RefreshCw" [size]="14" />
          Refresh
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
                  <th class="text-left py-2 px-2 font-medium">Coords</th>
                  <th class="text-left py-2 px-2 font-medium">Name</th>
                  <th class="text-left py-2 px-2 font-medium">Terrain</th>
                  <th class="text-right py-2 px-2 font-medium">Cap</th>
                  <th class="text-right py-2 px-2 font-medium">Def</th>
                  <th class="text-right py-2 px-2 font-medium">Inc ×</th>
                  <th class="text-left py-2 px-2 font-medium">Owner</th>
                  <th class="text-right py-2 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (t of rows(); track t.id) {
                  <tr class="border-b border-zinc-800/50 last:border-0">
                    <td class="py-2 px-2 font-mono text-xs">({{ t.x }},{{ t.y }})</td>
                    <td class="py-2 px-2">{{ t.name }}</td>
                    <td class="py-2 px-2">
                      <span class="inline-flex items-center gap-1.5">
                        <span [class]="dot(t.terrain)"></span>
                        <span class="capitalize">{{ t.terrain }}</span>
                      </span>
                    </td>
                    <td class="py-2 px-2 text-right tabular-nums">{{ t.business_capacity }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">+{{ t.defense_bonus }}</td>
                    <td class="py-2 px-2 text-right tabular-nums">×{{ t.income_multiplier }}</td>
                    <td class="py-2 px-2">
                      @if (t.owner) {
                        {{ t.owner.username }}
                      } @else {
                        <tt-badge variant="default">unclaimed</tt-badge>
                      }
                    </td>
                    <td class="py-2 px-2 text-right">
                      <div class="inline-flex items-center gap-1">
                        <tt-button size="sm" variant="ghost" (clicked)="edit(t)">
                          <lucide-angular [img]="Pencil" [size]="13" />
                        </tt-button>
                        @if (t.owner_id) {
                          <tt-button size="sm" variant="ghost" [loading]="clearingId() === t.id" (clicked)="clear(t)">
                            <lucide-angular [img]="Eraser" [size]="13" />
                          </tt-button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-zinc-500 mt-2 text-right">
            Showing {{ rows().length }} of {{ resource.value()?.total ?? 0 }} tiles
          </p>
        </tt-card>
      }
    </div>
  `,
})
export default class AdminTerritoriesComponent {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  protected readonly Pencil = Pencil;
  protected readonly Eraser = Eraser;
  protected readonly RefreshCw = RefreshCw;
  protected readonly filters = FILTERS;

  protected readonly filter = signal<FilterKey>('owned');
  protected readonly clearingId = signal<string | null>(null);

  protected readonly resource = rxResource({
    params: () => this.filter(),
    stream: ({ params: f }) => {
      const has_owner = f === 'owned' ? 'true' : f === 'unowned' ? 'false' : undefined;
      return this.admin.listTerritories({ limit: 100, has_owner: has_owner as 'true' | 'false' | undefined });
    },
  });

  protected readonly rows = computed<Territory[]>(() => this.resource.value()?.items ?? []);

  protected dot(terrain: Territory['terrain']): string {
    return `inline-block w-2.5 h-2.5 rounded-full ${TERRAIN_STYLES[terrain].base}`;
  }

  protected filterClass(value: FilterKey): string {
    const active = this.filter() === value;
    return `px-3 h-8 text-xs font-medium ${
      active ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
    }`;
  }

  protected reload(): void {
    this.resource.reload();
  }

  protected edit(t: Territory): void {
    const ref = this.dialog.open(TerritoryFormDialogComponent, {
      data: { tile: t }, hasBackdrop: true, backdropClass: 'bg-black/60',
    });
    ref.closed.subscribe((saved) => { if (saved) this.resource.reload(); });
  }

  protected clear(t: Territory): void {
    if (this.clearingId()) return;
    this.clearingId.set(t.id);
    this.admin.clearTerritory(t.id).subscribe({
      next: () => {
        this.clearingId.set(null);
        this.toast.success(`Cleared (${t.x},${t.y})`);
        this.resource.reload();
      },
      error: (err: ApiError) => {
        this.clearingId.set(null);
        this.toast.error('Clear failed', err.message);
      },
    });
  }
}
