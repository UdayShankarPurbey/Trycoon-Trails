import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CardComponent } from '../../shared/ui/card/card';

@Component({
  selector: 'tt-signup',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card>
      <h2 class="text-xl font-semibold mb-1">Begin your trail</h2>
      <p class="text-sm text-zinc-400 mb-5">Create an account to start building your empire.</p>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label for="username" class="block text-xs font-medium text-zinc-300 mb-1">Username</label>
          <input
            id="username"
            type="text"
            autocomplete="username"
            formControlName="username"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label for="email" class="block text-xs font-medium text-zinc-300 mb-1">Email</label>
          <input
            id="email"
            type="email"
            autocomplete="email"
            formControlName="email"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label for="password" class="block text-xs font-medium text-zinc-300 mb-1">Password</label>
          <input
            id="password"
            type="password"
            autocomplete="new-password"
            formControlName="password"
            class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <p class="text-[11px] text-zinc-500 mt-1">8+ chars, must contain letters and digits.</p>
        </div>
        <tt-button type="submit" [loading]="loading()" [disabled]="form.invalid" [fullWidth]="true">
          Create account
        </tt-button>
      </form>
      <p class="text-xs text-zinc-400 text-center mt-5">
        Already a player?
        <a routerLink="/login" class="text-amber-400 hover:text-amber-300 ml-1 font-medium">
          Log in
        </a>
      </p>
    </tt-card>
  `,
})
export default class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.auth.signup(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Account created', 'Welcome to Trycoon Trails!');
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        const detail = err.fieldErrors?.[0]?.message ?? err.message;
        this.toast.error('Signup failed', detail);
      },
    });
  }
}
