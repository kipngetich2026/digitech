import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              (click)="cancel.emit()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              [disabled]="busy"
              (click)="confirm.emit()"
            >
              {{ busy ? 'Working…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Delete';
  @Input() busy = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
