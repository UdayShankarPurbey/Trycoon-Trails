import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../../shared/ui/card/card';

@Component({
  selector: 'tt-placeholder',
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card [title]="title()">
      <p class="text-sm text-zinc-400">{{ description() }}</p>
    </tt-card>
  `,
})
export default class PlaceholderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('Coming soon.');
}
