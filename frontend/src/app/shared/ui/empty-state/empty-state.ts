import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData, Inbox } from 'lucide-angular';

@Component({
  selector: 'tt-empty-state',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center py-10 px-4 text-zinc-400">
      <lucide-angular [img]="icon()" [size]="40" class="text-zinc-600 mb-3" />
      <h4 class="text-base font-medium text-zinc-200">{{ title() }}</h4>
      @if (description()) {
        <p class="text-sm mt-1 max-w-sm">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<LucideIconData>(Inbox);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
