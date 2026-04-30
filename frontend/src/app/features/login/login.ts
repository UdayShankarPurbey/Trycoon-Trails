import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';

@Component({
  selector: 'tt-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card>
      <h2 class="text-xl font-semibold mb-1">Welcome back</h2>
      <p class="text-sm text-zinc-400 mb-5">Log in to continue your conquest.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label for="identifier" class="block text-xs font-medium text-zinc-300 mb-1">
            Username or email
          </label>
          <input
            id="identifier"
            type="text"
            autocomplete="username"
            formControlName="identifier"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label for="password" class="block text-xs font-medium text-zinc-300 mb-1">Password</label>
          <input
            id="password"
            type="password"
            autocomplete="current-password"
            formControlName="password"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <tt-button type="submit" [loading]="loading()" [disabled]="form.invalid" [fullWidth]="true">
          Log in
        </tt-button>
      </form>
      <p class="text-xs text-zinc-400 text-center mt-5">
        New player?
        <a routerLink="/signup" class="text-amber-400 hover:text-amber-300 ml-1 font-medium">
          Create an account
        </a>
      </p>
    </tt-card>
  `,
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Welcome back', `Hello, ${this.auth.user()?.username}!`);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error('Login failed', err.message);
      },
    });
  }
}
