import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div class="mb-3 text-3xl" aria-hidden="true">{{ icon }}</div>
      <p class="text-sm font-medium text-slate-700">{{ title }}</p>
      @if (hint) {
        <p class="mt-1 max-w-sm text-sm text-slate-500">{{ hint }}</p>
      }
      <div class="mt-4">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input({ required: true }) title = 'Nothing here yet';
  @Input() hint = '';
}
