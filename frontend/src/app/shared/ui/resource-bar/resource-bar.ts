import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, Coins, Gem, Users, Star, Award } from 'lucide-angular';
import { User } from '../../../core/types';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'tt-resource-bar',
  imports: [LucideAngularModule, FormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user(); as u) {
      <div [class]="rootClasses()">
        <div class="flex items-center gap-1.5 text-amber-300" [attr.title]="'Coins'">
          <lucide-angular [img]="Coins" [size]="16" />
          <span class="text-sm font-medium tabular-nums">{{ u.coins | ttFormatNumber }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-cyan-300" [attr.title]="'Gems'">
          <lucide-angular [img]="Gem" [size]="16" />
          <span class="text-sm font-medium tabular-nums">{{ u.gems | ttFormatNumber }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-rose-300" [attr.title]="'Manpower'">
          <lucide-angular [img]="Users" [size]="16" />
          <span class="text-sm font-medium tabular-nums">{{ u.manpower | ttFormatNumber }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-emerald-300" [attr.title]="'Reputation'">
          <lucide-angular [img]="Star" [size]="16" />
          <span class="text-sm font-medium tabular-nums">{{ u.reputation | ttFormatNumber }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-violet-300" [attr.title]="'Level'">
          <lucide-angular [img]="Award" [size]="16" />
          <span class="text-sm font-medium tabular-nums">L{{ u.level }}</span>
        </div>
      </div>
    }
  `,
})
export class ResourceBarComponent {
  readonly user = input.required<User | null>();
  readonly compact = input<boolean>(false);

  protected readonly Coins = Coins;
  protected readonly Gem = Gem;
  protected readonly Users = Users;
  protected readonly Star = Star;
  protected readonly Award = Award;

  protected rootClasses(): string {
    return this.compact()
      ? 'flex items-center gap-3 flex-wrap'
      : 'flex items-center gap-4 flex-wrap rounded-md bg-zinc-900/60 border border-zinc-800 px-3 py-2';
  }
}
