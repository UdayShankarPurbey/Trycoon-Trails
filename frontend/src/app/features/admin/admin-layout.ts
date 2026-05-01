import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  BarChart3, Users, Target, Building2, Swords, Trophy, Map, FileClock, ShieldCheck,
} from 'lucide-angular';

interface AdminTab {
  label: string;
  path: string;
  icon: typeof BarChart3;
}

const TABS: AdminTab[] = [
  { label: 'Stats',          path: 'stats',          icon: BarChart3 },
  { label: 'Players',        path: 'players',        icon: Users },
  { label: 'Missions',       path: 'missions',       icon: Target },
  { label: 'Business types', path: 'business-types', icon: Building2 },
  { label: 'Unit types',     path: 'unit-types',     icon: Swords },
  { label: 'Levels',         path: 'levels',         icon: Trophy },
  { label: 'Territories',    path: 'territories',    icon: Map },
  { label: 'Audit log',      path: 'audit-log',      icon: FileClock },
];

@Component({
  selector: 'tt-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-6xl">
      <header class="flex items-center gap-2">
        <span class="inline-flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/15 text-amber-300 border border-amber-600/40">
          <lucide-angular [img]="ShieldCheck" [size]="18" />
        </span>
        <div>
          <h2 class="text-xl font-semibold">Admin panel</h2>
          <p class="text-sm text-zinc-400">Catalog management, moderation, and audit log.</p>
        </div>
      </header>

      <nav class="flex flex-wrap gap-1.5">
        @for (t of tabs; track t.path) {
          <a
            [routerLink]="t.path"
            routerLinkActive="bg-amber-500/15 border-amber-600/40 text-amber-300"
            class="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
            <lucide-angular [img]="t.icon" [size]="12" />
            {{ t.label }}
          </a>
        }
      </nav>

      <router-outlet />
    </div>
  `,
})
export default class AdminLayoutComponent {
  protected readonly tabs = TABS;
  protected readonly ShieldCheck = ShieldCheck;
}
