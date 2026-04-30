import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'tt-dialog-shell',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block w-[min(560px,calc(100vw-2rem))] max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl text-zinc-100 overflow-hidden flex flex-col',
  },
  template: `
    <header class="flex items-center justify-between gap-3 px-5 h-12 border-b border-zinc-800">
      <h3 class="text-base font-semibold truncate">{{ title() }}</h3>
      <button
        type="button"
        (click)="onClose()"
        class="text-zinc-500 hover:text-zinc-200 p-1 rounded"
        [attr.aria-label]="'Close dialog'">
        <lucide-angular [img]="X" [size]="16" />
      </button>
    </header>

    <div class="flex-1 min-h-0 overflow-y-auto p-5">
      <ng-content />
    </div>

    <footer class="px-5 py-3 border-t border-zinc-800 flex items-center justify-end gap-2">
      <ng-content select="[dialog-footer]" />
    </footer>
  `,
})
export class DialogShellComponent {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  readonly title = input.required<string>();
  readonly closed = output<void>();

  protected readonly X = X;

  protected onClose(): void {
    this.closed.emit();
    this.dialogRef?.close();
  }
}
