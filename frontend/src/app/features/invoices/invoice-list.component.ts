import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { Invoice } from '../../core/models/invoice.models';
import { Order } from '../../core/models/order.models';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    FormsModule, RouterLink, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe, DatePipe,
  ],
  template: `
    <app-page-header title="Invoices" subtitle="Bill orders and track balances">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New invoice</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search invoice #…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} invoices</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No invoices yet" hint="Create an invoice from a completed or pending order." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Invoice</th>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Order</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-right">Balance</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (inv of filtered(); track inv._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <a [routerLink]="['/invoices', inv._id]" class="font-medium text-slate-800 hover:text-indigo-600">
                    {{ inv.invoiceNumber }}
                  </a>
                  <p class="text-xs text-slate-400">{{ inv.issueDate | appDate }}</p>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ customerName(inv) }}</td>
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ orderNumber(inv) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ inv.total | kes }}</td>
                <td class="px-4 py-3 text-right" [class.text-rose-600]="inv.balanceDue > 0">{{ inv.balanceDue | kes }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="inv.status" /></td>
                <td class="px-4 py-3"><app-status-badge [status]="inv.paymentStatus" /></td>
                <td class="px-4 py-3 text-right">
                  <a [routerLink]="['/invoices', inv._id]" class="text-xs font-medium text-indigo-600 hover:underline">View</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (createOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="createOpen.set(false)">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">New invoice</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="create()" #f="ngForm">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Order</label>
              <select name="orderId" required [(ngModel)]="createForm.orderId"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none">
                <option value="" disabled>Select order</option>
                @for (o of billableOrders(); track o._id) {
                  <option [value]="o._id">{{ o.orderNumber }} — {{ o.total | kes }}</option>
                }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Amount paid now</label>
                <input name="amountPaid" type="number" min="0" step="0.01" [(ngModel)]="createForm.amountPaid"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Due date</label>
                <input name="dueDate" type="date" [(ngModel)]="createForm.dueDate"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea name="notes" rows="2" [(ngModel)]="createForm.notes"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"></textarea>
            </div>
            @if (createError()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ createError() }}</p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                (click)="createOpen.set(false)">Cancel</button>
              <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                [disabled]="creating() || f.invalid">{{ creating() ? 'Creating…' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete invoice"
      [message]="'Delete invoice ' + (deleteTarget()?.invoiceNumber || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class InvoiceListComponent implements OnInit {
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Invoice[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly query = signal('');
  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly deleteTarget = signal<Invoice | null>(null);
  readonly deleting = signal(false);

  createForm: { orderId: string; amountPaid: number; dueDate: string; notes: string } = {
    orderId: '', amountPaid: 0, dueDate: '', notes: '',
  };

  ngOnInit(): void {
    this.reload();
    this.sales.listOrders().subscribe({ next: (l) => this.orders.set(l) });
  }

  reload(): void {
    this.loading.set(true);
    this.sales.listInvoices().subscribe({
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

  billableOrders(): Order[] {
    return this.orders().filter((o) => o.status !== 'CANCELLED');
  }

  customerName(inv: Invoice): string {
    const c = inv.customerId;
    return c && typeof c === 'object' ? `${c.firstName} ${c.lastName}` : '—';
  }

  orderNumber(inv: Invoice): string {
    const o = inv.orderId;
    return o && typeof o === 'object' ? o.orderNumber : '—';
  }

  filtered(): Invoice[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((inv) =>
      [inv.invoiceNumber, this.customerName(inv), this.orderNumber(inv)]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.createForm = { orderId: '', amountPaid: 0, dueDate: '', notes: '' };
    this.createError.set('');
    this.createOpen.set(true);
  }

  create(): void {
    if (this.creating()) return;
    this.creating.set(true);
    this.createError.set('');

    this.sales.createInvoice({
      orderId: this.createForm.orderId,
      amountPaid: Number(this.createForm.amountPaid) || 0,
      dueDate: this.createForm.dueDate || undefined,
      notes: this.createForm.notes.trim() || undefined,
    }).subscribe({
      next: (inv) => {
        this.creating.set(false);
        this.createOpen.set(false);
        this.toast.success(`Invoice ${inv.invoiceNumber} created`);
        this.reload();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(errorMessage(err.error ?? err));
      },
    });
  }

  askDelete(inv: Invoice): void {
    this.deleteTarget.set(inv);
  }

  doDelete(): void {
    const inv = this.deleteTarget();
    if (!inv) return;
    this.deleting.set(true);
    this.sales.deleteInvoice(inv._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Invoice deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
