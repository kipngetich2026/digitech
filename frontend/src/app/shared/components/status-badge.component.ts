import { Component, Input } from '@angular/core';
import { LabelPipe } from '../pipes/label.pipe';

const STATUS_STYLES: Record<string, string> = {
  // generic
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-200',
  // orders
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  PROCESSING: 'bg-sky-50 text-sky-700 ring-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  // payments
  UNPAID: 'bg-rose-50 text-rose-700 ring-rose-200',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REVERSED: 'bg-slate-100 text-slate-600 ring-slate-200',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-200',
  // expenses
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  // invoices
  ISSUED: 'bg-sky-50 text-sky-700 ring-sky-200',
  // notifications
  INFO: 'bg-sky-50 text-sky-700 ring-sky-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  WARNING: 'bg-amber-50 text-amber-700 ring-amber-200',
  ERROR: 'bg-rose-50 text-rose-700 ring-rose-200',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [LabelPipe],
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="cls"
    >
      {{ status | label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  get cls(): string {
    return STATUS_STYLES[this.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  }
}
