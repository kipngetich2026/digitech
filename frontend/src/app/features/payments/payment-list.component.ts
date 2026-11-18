import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Payment, PaymentMethod } from '../../core/models/payment.models';
import { Invoice } from '../../core/models/invoice.models';
import { downloadBlob, filenameFromDisposition } from '../../core/services/download.util';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    ConfirmDialogComponent,
    KesPipe,
    DatePipe,
  ],
  template: `
    <app-page-header title="Payments" subtitle="Record and reverse invoice payments">
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()"
      >
        + Record payment
      </button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input
        [value]="query()"
        (search)="query.set($event)"
        placeholder="Search payment #…"
      />
      <span class="text-xs text-slate-400">{{ filtered().length }} payments</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state
        title="No payments yet"
        hint="Record a payment against an outstanding invoice."
      />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead
            class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            <tr>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3">Invoice</th>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Method</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (p of filtered(); track p._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3 font-medium text-slate-800">{{ p.paymentNumber }}</td>
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ invoiceNumber(p) }}</td>
                <td class="px-4 py-3 text-slate-600">{{ customerName(p) }}</td>
                <td class="px-4 py-3 text-slate-600">{{ p.method }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-800">
                  {{ p.amount | kes }}
                </td>
                <td class="px-4 py-3"><app-status-badge [status]="p.status" /></td>
                <td class="px-4 py-3 text-slate-500">{{ p.createdAt | appDate }}</td>
                <td class="px-4 py-3 text-right">
                  @if (p.status === 'COMPLETED') {
                    <button
                      type="button"
                      class="mr-3 text-xs font-medium text-indigo-600 hover:underline"
                      [disabled]="downloadingId() === p._id"
                      (click)="downloadReceipt(p)"
                    >
                      {{ downloadingId() === p._id ? '…' : 'Receipt' }}
                    </button>
                    <button
                      type="button"
                      class="mr-3 text-xs font-medium text-amber-600 hover:underline"
                      (click)="askReverse(p)"
                    >
                      Reverse
                    </button>
                    <button
                      type="button"
                      class="text-xs font-medium text-rose-600 hover:underline"
                      (click)="askDelete(p)"
                    >
                      Delete
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (createOpen()) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
        (click)="createOpen.set(false)"
      >
        <div
          class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-semibold text-slate-900">Record payment</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="create()" #f="ngForm">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Invoice</label>
              <select
                name="invoiceId"
                required
                [(ngModel)]="createForm.invoiceId"
                (ngChange)="syncBalance()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="" disabled>Select invoice</option>
                @for (inv of openInvoices(); track inv._id) {
                  <option [value]="inv._id">
                    {{ inv.invoiceNumber }} — balance {{ inv.balanceDue | kes }}
                  </option>
                }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  [(ngModel)]="createForm.amount"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Method</label>
                <select
                  name="method"
                  required
                  [(ngModel)]="createForm.method"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  @for (m of methods; track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Reference</label>
              <input
                name="reference"
                maxlength="100"
                [(ngModel)]="createForm.reference"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                name="notes"
                rows="2"
                maxlength="1000"
                [(ngModel)]="createForm.notes"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              ></textarea>
            </div>
            @if (createError()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {{ createError() }}
              </p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                (click)="createOpen.set(false)"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                [disabled]="creating() || f.invalid"
              >
                {{ creating() ? 'Saving…' : 'Record' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-confirm-dialog
      [open]="reverseTarget() !== null"
      title="Reverse payment"
      message="Reversing restores the invoice balance. This cannot be undone."
      confirmLabel="Reverse"
      [busy]="busy()"
      (confirm)="doReverse()"
      (cancel)="reverseTarget.set(null)"
    />

    <app-confirm-dialog
      [open]="deleteTarget() !== null"
      title="Delete payment"
      message="Only non-completed payments can be deleted."
      [busy]="busy()"
      (confirm)="doDelete()"
      (cancel)="deleteTarget.set(null)"
    />
  `,
})
export class PaymentListComponent implements OnInit {
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Payment[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly query = signal('');
  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly reverseTarget = signal<Payment | null>(null);
  readonly deleteTarget = signal<Payment | null>(null);
  readonly busy = signal(false);
  readonly downloadingId = signal<string | null>(null);

  readonly methods: PaymentMethod[] = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CARD', 'CHEQUE'];

  createForm: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    notes: string;
  } = {
    invoiceId: '',
    amount: 0,
    method: 'CASH',
    reference: '',
    notes: '',
  };

  ngOnInit(): void {
    this.reload();
    this.sales.listInvoices().subscribe({ next: (l) => this.invoices.set(l) });
  }

  reload(): void {
    this.loading.set(true);
    this.sales.listPayments().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }

  openInvoices(): Invoice[] {
    return this.invoices().filter((i) => i.status === 'ISSUED' && i.balanceDue > 0);
  }

  invoiceNumber(p: Payment): string {
    const inv = p.invoiceId;
    return inv && typeof inv === 'object' ? inv.invoiceNumber : '—';
  }

  customerName(p: Payment): string {
    const c = p.customerId;
    return c && typeof c === 'object' ? `${c.firstName} ${c.lastName}` : '—';
  }

  filtered(): Payment[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((p) =>
      [p.paymentNumber, this.invoiceNumber(p), this.customerName(p), p.method].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }

  openCreate(): void {
    this.createForm = { invoiceId: '', amount: 0, method: 'CASH', reference: '', notes: '' };
    this.createError.set('');
    this.createOpen.set(true);
  }

  syncBalance(): void {
    const inv = this.invoices().find((i) => i._id === this.createForm.invoiceId);
    if (inv) this.createForm.amount = inv.balanceDue;
  }

  create(): void {
    if (this.creating()) return;
    this.creating.set(true);
    this.createError.set('');

    this.sales
      .createPayment({
        invoiceId: this.createForm.invoiceId,
        amount: Number(this.createForm.amount),
        method: this.createForm.method,
        reference: this.createForm.reference.trim() || undefined,
        notes: this.createForm.notes.trim() || undefined,
      })
      .subscribe({
        next: (p) => {
          this.creating.set(false);
          this.createOpen.set(false);
          this.toast.success(`Payment ${p.paymentNumber} recorded`);
          this.reload();
          this.sales.listInvoices().subscribe({ next: (l) => this.invoices.set(l) });
          // Auto-generate + download receipt
          if (p.status === 'COMPLETED') {
            this.downloadReceipt(p, true);
          }
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(errorMessage(err.error ?? err));
        },
      });
  }

  downloadReceipt(p: Payment, auto = false): void {
    if (this.downloadingId()) return;
    this.downloadingId.set(p._id);
    this.sales.downloadReceipt(p._id).subscribe({
      next: (res) => {
        this.downloadingId.set(null);
        if (!res.body) return;
        const filename = filenameFromDisposition(
          res.headers.get('Content-Disposition'),
          `${p.paymentNumber}-receipt.pdf`,
        );
        downloadBlob(res.body, filename);
        if (!auto) this.toast.success(`Receipt ${filename} downloaded`);
      },
      error: () => {
        this.downloadingId.set(null);
        // Global interceptor already toasts blob errors
      },
    });
  }

  askReverse(p: Payment): void {
    this.reverseTarget.set(p);
  }

  doReverse(): void {
    const p = this.reverseTarget();
    if (!p) return;
    this.busy.set(true);
    this.sales.setPaymentStatus(p._id, 'REVERSED').subscribe({
      next: () => {
        this.busy.set(false);
        this.reverseTarget.set(null);
        this.toast.success('Payment reversed');
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }

  askDelete(p: Payment): void {
    this.deleteTarget.set(p);
  }

  doDelete(): void {
    const p = this.deleteTarget();
    if (!p) return;
    this.busy.set(true);
    this.sales.deletePayment(p._id).subscribe({
      next: () => {
        this.busy.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Payment deleted');
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
