import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CardComponent } from '../../shared/ui/card/card';
import { ResourceBarComponent } from '../../shared/ui/resource-bar/resource-bar';
import { ProfileAvatarCardComponent } from './components/profile-avatar-card';
import { ProfileInfoCardComponent } from './components/profile-info-card';
import { ProfileSecurityCardComponent } from './components/profile-security-card';

@Component({
  selector: 'tt-profile',
  imports: [
    ProfileAvatarCardComponent,
    ProfileInfoCardComponent,
    ProfileSecurityCardComponent,
    CardComponent,
    ResourceBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 max-w-3xl">
      <header>
        <h2 class="text-xl font-semibold">Your profile</h2>
        <p class="text-sm text-zinc-400">Manage avatar, username, and password.</p>
      </header>

      <tt-card title="Resources">
        <tt-resource-bar [user]="user()" />
      </tt-card>

      <tt-profile-avatar-card />
      <tt-profile-info-card />
      <tt-profile-security-card />
    </div>
  `,
})
export default class ProfileComponent {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
}
