import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Invoice } from '../../core/models/invoice.models';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    RouterLink, PageHeaderComponent, LoadingComponent, StatusBadgeComponent,
    KesPipe, DatePipe, ConfirmDialogComponent,
  ],
  template: `
    <app-page-header title="Invoice" backLink="/invoices" backLabel="Invoices" />

    @if (loading()) {
      <app-loading />
    } @else if (invoice(); as inv) {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
          <section class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-lg font-semibold text-slate-900">{{ inv.invoiceNumber }}</p>
                <p class="text-sm text-slate-500">Issued {{ inv.issueDate | appDate }}
                  @if (inv.dueDate) { · Due {{ inv.dueDate | appDate }} }
                </p>
              </div>
              <div class="flex gap-2">
                <app-status-badge [status]="inv.status" />
                <app-status-badge [status]="inv.paymentStatus" />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-slate-400">Customer</p>
                <p class="font-medium text-slate-800">{{ customerName(inv) }}</p>
              </div>
              <div>
                <p class="text-slate-400">Order</p>
                <p class="font-medium text-slate-800">{{ orderNumber(inv) }}</p>
              </div>
            </div>
            @if (inv.notes) {
              <p class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{{ inv.notes }}</p>
            }
          </section>

          <section class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div class="border-b border-slate-100 px-5 py-3">
              <h3 class="text-sm font-semibold text-slate-900">Line items</h3>
            </div>
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th class="px-5 py-2">Item</th>
                  <th class="px-5 py-2 text-right">Unit</th>
                  <th class="px-5 py-2 text-center">Qty</th>
                  <th class="px-5 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of inv.items; track item._id) {
                  <tr>
                    <td class="px-5 py-2.5 font-medium text-slate-800">{{ item.itemName }}</td>
                    <td class="px-5 py-2.5 text-right text-slate-600">{{ item.unitPrice | kes }}</td>
                    <td class="px-5 py-2.5 text-center text-slate-600">{{ item.quantity }}</td>
                    <td class="px-5 py-2.5 text-right font-medium">{{ item.subtotal | kes }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h3 class="mb-3 text-sm font-semibold text-slate-900">Amounts</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>{{ inv.subtotal | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Discount</dt><dd>-{{ inv.discount | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd>+{{ inv.tax | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Total</dt><dd class="font-semibold">{{ inv.total | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Paid</dt><dd class="text-emerald-600">{{ inv.amountPaid | kes }}</dd></div>
              <div class="flex justify-between border-t border-slate-100 pt-2">
                <dt class="font-medium">Balance due</dt>
                <dd class="font-semibold" [class.text-rose-600]="inv.balanceDue > 0">{{ inv.balanceDue | kes }}</dd>
              </div>
            </dl>
          </div>

          @if (inv.status === 'ISSUED' && inv.balanceDue > 0) {
            <a routerLink="/payments"
              class="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700">
              Record payment
            </a>
          }

          @if (inv.status === 'ISSUED') {
            <button type="button"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              (click)="cancel()">Cancel invoice</button>
          }

          <button type="button"
            class="w-full rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            (click)="deleteOpen = true">Delete invoice</button>
        </aside>
      </div>
    }

    <app-confirm-dialog [open]="deleteOpen" title="Delete invoice" message="Paid invoices cannot be deleted."
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteOpen = false" />
  `,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly invoice = signal<Invoice | null>(null);
  readonly deleting = signal(false);
  deleteOpen = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sales.getInvoice(id).subscribe({
      next: (inv) => {
        this.invoice.set(inv);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }

  customerName(inv: Invoice): string {
    const c = inv.customerId;
    return c && typeof c === 'object' ? `${c.firstName} ${c.lastName} (${c.customerNumber})` : '—';
  }

  orderNumber(inv: Invoice): string {
    const o = inv.orderId;
    return o && typeof o === 'object' ? o.orderNumber : '—';
  }

  cancel(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.sales.setInvoiceStatus(inv._id, 'CANCELLED').subscribe({
      next: (updated) => {
        this.invoice.set(updated);
        this.toast.success('Invoice cancelled');
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  doDelete(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.deleting.set(true);
    this.sales.deleteInvoice(inv._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen = false;
        this.toast.success('Invoice deleted');
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
