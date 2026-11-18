import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <nav class="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          @if (backLink) {
            <a [routerLink]="backLink" class="hover:text-slate-600">{{ backLabel }}</a>
            <span class="mx-1">/</span>
          }
          <span class="text-slate-500">{{ title }}</span>
        </nav>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() backLink = '';
  @Input() backLabel = 'Back';
}
