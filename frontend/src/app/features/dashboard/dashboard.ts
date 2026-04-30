import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CardComponent } from '../../shared/ui/card/card';
import { ResourceBarComponent } from '../../shared/ui/resource-bar/resource-bar';

@Component({
  selector: 'tt-dashboard',
  imports: [CardComponent, ResourceBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Welcome, {{ user()?.username }}</h2>
        <p class="text-sm text-zinc-400">Section F3 will replace this dashboard with stats, missions snapshot, and recent activity.</p>
      </div>
      <tt-card title="Your resources">
        <tt-resource-bar [user]="user()" />
      </tt-card>
    </div>
  `,
})
export default class DashboardComponent {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
}
