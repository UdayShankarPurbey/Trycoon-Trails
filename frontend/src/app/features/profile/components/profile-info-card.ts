import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Save } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { BadgeComponent } from '../../../shared/ui/badge/badge';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'tt-profile-info-card',
  imports: [
    ReactiveFormsModule, BadgeComponent, ButtonComponent, CardComponent,
    LucideAngularModule, TimeAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user(); as u) {
      <tt-card title="Profile" subtitle="Public details">
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label for="username" class="block text-xs font-medium text-zinc-300 mb-1">Username</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              autocomplete="username"
              class="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <p class="text-[11px] text-zinc-500 mt-1">3–32 chars, letters / digits / underscore.</p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Email</p>
              <p class="text-zinc-200">{{ u.email }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Role</p>
              <tt-badge [variant]="u.role === 'admin' ? 'gold' : 'default'">{{ u.role }}</tt-badge>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Level</p>
              <p class="text-zinc-200 tabular-nums">L{{ u.level }} · {{ u.xp }} xp</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Daily streak</p>
              <p class="text-zinc-200 tabular-nums">{{ u.daily_streak ?? 0 }} day(s)</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Member since</p>
              <p class="text-zinc-200">{{ u.createdAt | ttTimeAgo }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Last active</p>
              <p class="text-zinc-200">{{ u.last_active_at | ttTimeAgo }}</p>
            </div>
          </div>

          <div class="flex justify-end">
            <tt-button
              type="submit"
              size="sm"
              [loading]="saving()"
              [disabled]="form.invalid || form.pristine">
              <lucide-angular [img]="Save" [size]="14" />
              Save changes
            </tt-button>
          </div>
        </form>
      </tt-card>
    }
  `,
})
export class ProfileInfoCardComponent {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly user = this.auth.user;
  protected readonly Save = Save;
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: [
      this.user()?.username ?? '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(32),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
  });

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    const { username } = this.form.getRawValue();
    if (username === this.user()?.username) return;
    this.saving.set(true);
    this.userService.updateProfile({ username }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.toast.success('Profile updated');
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error('Update failed', err.message);
      },
    });
  }
}
