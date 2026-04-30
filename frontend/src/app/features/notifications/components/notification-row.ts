import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule, Bell, Swords, ShieldCheck, Crown, Target, Award, Gift, Mail, ChevronRight,
} from 'lucide-angular';
import { AppNotification, NotificationType } from '../../../core/types';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

const ICON_MAP: Record<NotificationType, typeof Bell> = {
  battle_attacked: Swords,
  battle_defended: ShieldCheck,
  territory_captured: Crown,
  mission_complete: Target,
  level_up: Award,
  admin_grant: Gift,
  admin_message: Mail,
  system: Bell,
};

const COLOR_MAP: Record<NotificationType, string> = {
  battle_attacked: 'text-rose-300 bg-rose-500/15',
  battle_defended: 'text-emerald-300 bg-emerald-500/15',
  territory_captured: 'text-amber-300 bg-amber-500/15',
  mission_complete: 'text-cyan-300 bg-cyan-500/15',
  level_up: 'text-violet-300 bg-violet-500/15',
  admin_grant: 'text-amber-300 bg-amber-500/15',
  admin_message: 'text-sky-300 bg-sky-500/15',
  system: 'text-zinc-300 bg-zinc-700/30',
};

@Component({
  selector: 'tt-notification-row',
  imports: [LucideAngularModule, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li>
      <button
        type="button"
        (click)="activated.emit()"
        [class]="rootClass()">
        <span [class]="iconClass()">
          <lucide-angular [img]="icon()" [size]="14" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p [class]="titleClass()">{{ notification().title }}</p>
            @if (!notification().is_read) {
              <span class="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true"></span>
            }
          </div>
          @if (notification().body) {
            <p class="text-xs text-zinc-400 truncate mt-0.5">{{ notification().body }}</p>
          }
          <p class="text-[11px] text-zinc-500 mt-0.5">{{ notification().createdAt | ttTimeAgo }}</p>
        </div>
        <lucide-angular [img]="ChevronRight" [size]="14" class="text-zinc-500 shrink-0" />
      </button>
    </li>
  `,
})
export class NotificationRowComponent {
  readonly notification = input.required<AppNotification>();
  readonly activated = output<void>();

  protected readonly ChevronRight = ChevronRight;

  protected readonly icon = computed(() => ICON_MAP[this.notification().type]);

  protected iconClass(): string {
    return `shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md ${COLOR_MAP[this.notification().type]}`;
  }

  protected titleClass(): string {
    return `text-sm truncate ${this.notification().is_read ? 'text-zinc-300' : 'text-zinc-100 font-medium'}`;
  }

  protected rootClass(): string {
    return [
      'w-full text-left flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md',
      'hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-800/60 transition',
    ].join(' ');
  }
}
