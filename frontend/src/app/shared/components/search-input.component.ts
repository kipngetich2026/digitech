import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  template: `
    <div class="relative">
      <svg
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m21 21-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        />
      </svg>
      <input
        type="search"
        class="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent focus:border-slate-400 focus:outline-none focus:ring-slate-200"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
      />
    </div>
  `,
})
export class SearchInputComponent {
  @Input() placeholder = 'Search…';
  @Input() value = '';
  @Output() search = new EventEmitter<string>();

  onInput(ev: Event): void {
    this.search.emit((ev.target as HTMLInputElement).value);
  }
}
