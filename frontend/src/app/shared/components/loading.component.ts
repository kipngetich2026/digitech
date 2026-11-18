import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="flex items-center justify-center gap-3 py-14 text-sm text-slate-500">
      <span
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
        aria-hidden="true"
      ></span>
      {{ label }}
    </div>
  `,
})
export class LoadingComponent {
  @Input() label = 'Loading…';
}
