import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Map,
  Building2,
  Swords,
  Target,
  Trophy,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  Castle,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ResourceBarComponent } from '../../shared/ui/resource-bar/resource-bar';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

@Component({
  selector: 'tt-app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ResourceBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-zinc-950 text-zinc-100">
      <aside
        [class]="'shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col transition-all '
          + (sidebarOpen() ? 'w-60' : 'w-16')">
        <div class="h-14 px-3 flex items-center gap-2 border-b border-zinc-800">
          <button
            type="button"
            (click)="toggleSidebar()"
            class="p-2 rounded hover:bg-zinc-800 text-zinc-300"
            [attr.aria-label]="sidebarOpen() ? 'Collapse sidebar' : 'Expand sidebar'">
            <lucide-angular [img]="Menu" [size]="18" />
          </button>
          @if (sidebarOpen()) {
            <span class="font-semibold text-amber-400 truncate">Trycoon</span>
          }
        </div>
        <nav class="flex-1 overflow-y-auto py-3">
          <ul class="space-y-0.5 px-2">
            @for (item of visibleNav(); track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-amber-500/15 text-amber-300 border-amber-500/30"
                  [routerLinkActiveOptions]="{ exact: false }"
                  class="flex items-center gap-3 px-3 h-10 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 border border-transparent">
                  <lucide-angular [img]="item.icon" [size]="18" />
                  @if (sidebarOpen()) {
                    <span class="truncate">{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </nav>
        <div class="p-2 border-t border-zinc-800">
          <button
            type="button"
            (click)="logout()"
            class="w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm text-zinc-300 hover:bg-zinc-800">
            <lucide-angular [img]="LogOut" [size]="18" />
            @if (sidebarOpen()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-14 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
          <div class="flex items-center gap-2 text-sm text-zinc-300">
            <lucide-angular [img]="Castle" [size]="16" class="text-amber-400" />
            <span class="font-medium">{{ user()?.username }}</span>
            @if (user()?.role === 'admin') {
              <span class="ml-1 inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-500/15 border border-amber-600/40 px-2 py-0.5 rounded-full">
                <lucide-angular [img]="ShieldCheck" [size]="12" />
                admin
              </span>
            }
          </div>
          <tt-resource-bar [user]="user()" [compact]="true" />
        </header>
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AppLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly sidebarOpen = signal(true);

  protected readonly Menu = Menu;
  protected readonly Castle = Castle;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly LogOut = LogOut;

  private readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'World', path: '/world', icon: Map },
    { label: 'Businesses', path: '/businesses', icon: Building2 },
    { label: 'Army', path: '/army', icon: Swords },
    { label: 'Missions', path: '/missions', icon: Target },
    { label: 'Leaderboards', path: '/leaderboards', icon: Trophy },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: Settings },
    { label: 'Admin', path: '/admin', icon: ShieldCheck, adminOnly: true },
  ];

  protected readonly visibleNav = computed<NavItem[]>(() =>
    this.nav.filter((i) => !i.adminOnly || this.isAdmin()),
  );

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.toast.success('Logged out');
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.auth.clearAuth();
        void this.router.navigate(['/login']);
      },
    });
  }
}
