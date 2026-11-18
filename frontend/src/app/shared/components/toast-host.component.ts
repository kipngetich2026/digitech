import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="rounded-lg px-4 py-3 text-sm font-medium shadow-lg ring-1"
          [class]="
            t.kind === 'success'
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
              : t.kind === 'error'
                ? 'bg-rose-50 text-rose-800 ring-rose-200'
                : 'bg-sky-50 text-sky-800 ring-sky-200'
          "
          role="status"
        >
          {{ t.text }}
          <button
            type="button"
            class="float-right ml-2 opacity-60 hover:opacity-100"
            (click)="toast.dismiss(t.id)"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toast = inject(ToastService);
}
