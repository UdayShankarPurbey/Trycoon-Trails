import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'tt-auth-layout',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen flex items-center justify-center px-4 py-10 bg-zinc-950 text-zinc-100">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            Trycoon Trails
          </h1>
          <p class="text-sm text-zinc-400 mt-1">Build your empire. Capture the world.</p>
        </div>
        <router-outlet />
      </div>
    </main>
  `,
})
export class AuthLayoutComponent {}
