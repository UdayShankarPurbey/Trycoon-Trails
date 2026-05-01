import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Upload, ImageIcon, User as UserIcon } from 'lucide-angular';
import { ApiError } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { CardComponent } from '../../../shared/ui/card/card';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = /^image\/(jpeg|jpg|png|webp|gif)$/;

@Component({
  selector: 'tt-profile-avatar-card',
  imports: [CardComponent, ButtonComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tt-card title="Avatar" subtitle="JPG / PNG / WEBP / GIF, up to 5 MB">
      <div class="flex items-start gap-5">
        <div class="shrink-0">
          @if (preview() ?? user()?.avatar_url; as src) {
            <img
              [src]="src"
              alt="avatar preview"
              width="96"
              height="96"
              class="w-24 h-24 rounded-lg object-cover border border-zinc-800" />
          } @else {
            <div class="w-24 h-24 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500">
              <lucide-angular [img]="UserIcon" [size]="36" />
            </div>
          }
        </div>
        <div class="flex-1 min-w-0">
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="hidden"
            (change)="onFile($event)" />
          <div class="flex items-center gap-2 flex-wrap">
            <tt-button variant="secondary" size="sm" (clicked)="fileInput.click()">
              <lucide-angular [img]="ImageIcon" [size]="14" />
              Choose file
            </tt-button>
            @if (selected()) {
              <tt-button size="sm" [loading]="uploading()" (clicked)="upload()">
                <lucide-angular [img]="Upload" [size]="14" />
                Upload
              </tt-button>
              <tt-button variant="ghost" size="sm" (clicked)="clear()">
                Cancel
              </tt-button>
            }
          </div>
          @if (selected(); as f) {
            <p class="text-xs text-zinc-400 mt-2">{{ f.name }} · {{ kb(f.size) }} KB</p>
          } @else {
            <p class="text-xs text-zinc-500 mt-2">Pick an image to preview, then upload.</p>
          }
        </div>
      </div>
    </tt-card>
  `,
})
export class ProfileAvatarCardComponent {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;

  protected readonly Upload = Upload;
  protected readonly ImageIcon = ImageIcon;
  protected readonly UserIcon = UserIcon;

  protected readonly selected = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);
  protected readonly uploading = signal(false);

  protected onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!ALLOWED.test(file.type)) {
      this.toast.error('Unsupported file type', file.type || 'unknown');
      input.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      this.toast.error('File too large', `${this.kb(file.size)} KB > 5 MB`);
      input.value = '';
      return;
    }
    this.selected.set(file);
    const url = URL.createObjectURL(file);
    this.preview.set(url);
  }

  protected clear(): void {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
    this.selected.set(null);
    this.preview.set(null);
  }

  protected upload(): void {
    const file = this.selected();
    if (!file || this.uploading()) return;
    this.uploading.set(true);
    this.userService.uploadAvatar(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.toast.success('Avatar updated');
        this.clear();
      },
      error: (err: ApiError) => {
        this.uploading.set(false);
        this.toast.error('Upload failed', err.message);
      },
    });
  }

  protected kb(bytes: number): number {
    return Math.round(bytes / 1024);
  }
}
