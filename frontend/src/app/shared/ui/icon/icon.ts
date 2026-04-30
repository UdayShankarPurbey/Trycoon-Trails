import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
  selector: 'tt-icon',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lucide-angular [img]="icon()" [size]="size()" [strokeWidth]="strokeWidth()" />`,
  host: { class: 'inline-flex items-center justify-center' },
})
export class IconComponent {
  readonly icon = input.required<LucideIconData>();
  readonly size = input<number>(16);
  readonly strokeWidth = input<number>(2);
}
