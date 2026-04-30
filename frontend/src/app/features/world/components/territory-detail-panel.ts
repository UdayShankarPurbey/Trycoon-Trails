import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule, MapPin, ShieldCheck, Building2, Hammer, Lock } from 'lucide-angular';
import { Territory } from '../../../core/types';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { CardComponent } from '../../../shared/ui/card/card';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TERRAIN_STYLES, ownershipOf } from '../world-utils';

@Component({
  selector: 'tt-territory-detail-panel',
  imports: [CardComponent, BadgeComponent, EmptyStateComponent, LucideAngularModule, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tile(); as t) {
      <tt-card>
        <header class="flex items-start gap-3 mb-3">
          <span [class]="'shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md ' + terrainStyle().base">
            <lucide-angular [img]="MapPin" [size]="18" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-semibold truncate">{{ t.name }}</h3>
            <p class="text-xs text-zinc-400">
              ({{ t.x }}, {{ t.y }}) · {{ terrainStyle().label }}
            </p>
          </div>
          <tt-badge [variant]="ownershipBadge()">{{ ownershipLabel() }}</tt-badge>
        </header>

        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Capacity</dt>
            <dd class="text-zinc-200 inline-flex items-center gap-1.5">
              <lucide-angular [img]="Building2" [size]="14" class="text-zinc-400" />
              {{ t.business_capacity }} slots
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Defense</dt>
            <dd class="text-zinc-200 inline-flex items-center gap-1.5">
              <lucide-angular [img]="ShieldCheck" [size]="14" class="text-zinc-400" />
              +{{ t.defense_bonus }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Income mult</dt>
            <dd class="text-zinc-200 inline-flex items-center gap-1.5">
              <lucide-angular [img]="Hammer" [size]="14" class="text-zinc-400" />
              ×{{ t.income_multiplier }}
            </dd>
          </div>
          @if (t.capture_cooldown_until) {
            <div>
              <dt class="text-[11px] uppercase tracking-wide text-zinc-500">Cooldown</dt>
              <dd class="text-amber-300 inline-flex items-center gap-1.5">
                <lucide-angular [img]="Lock" [size]="14" />
                until {{ t.capture_cooldown_until | ttTimeAgo }}
              </dd>
            </div>
          }
        </dl>

        <hr class="border-zinc-800 my-4" />

        @if (t.owner; as owner) {
          <div class="space-y-1">
            <p class="text-[11px] uppercase tracking-wide text-zinc-500">Owner</p>
            <p class="text-sm text-zinc-200">
              {{ owner.username }}
              <span class="text-zinc-500 text-xs ml-1">L{{ owner.level }}</span>
            </p>
            @if (owner.shield_until) {
              <p class="text-[11px] text-emerald-300">Under new-player shield</p>
            }
            @if (t.captured_at) {
              <p class="text-[11px] text-zinc-500">Held since {{ t.captured_at | ttTimeAgo }}</p>
            }
          </div>
        } @else {
          <p class="text-sm text-zinc-400">This tile is unclaimed.</p>
        }

        <div class="mt-4">
          <ng-content />
        </div>
      </tt-card>
    } @else {
      <tt-card>
        <tt-empty-state
          [icon]="MapPin"
          title="Select a tile"
          description="Click any tile on the map to see its details." />
      </tt-card>
    }
  `,
})
export class TerritoryDetailPanelComponent {
  readonly tile = input<Territory | null>(null);
  readonly currentUserId = input<string | null>(null);

  protected readonly MapPin = MapPin;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly Building2 = Building2;
  protected readonly Hammer = Hammer;
  protected readonly Lock = Lock;

  protected readonly terrainStyle = computed(() => TERRAIN_STYLES[this.tile()!.terrain]);

  protected readonly ownership = computed(() =>
    this.tile() ? ownershipOf(this.tile()!, this.currentUserId()) : 'unowned',
  );

  protected ownershipLabel(): string {
    const o = this.ownership();
    return o === 'mine' ? 'Yours' : o === 'other' ? 'Enemy' : 'Unclaimed';
  }

  protected ownershipBadge(): 'gold' | 'danger' | 'default' {
    const o = this.ownership();
    return o === 'mine' ? 'gold' : o === 'other' ? 'danger' : 'default';
  }
}
