import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Order, OrderStatus } from '../../core/models/order.models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    RouterLink, PageHeaderComponent, LoadingComponent, StatusBadgeComponent,
    KesPipe, DatePipe, ConfirmDialogComponent,
  ],
  template: `
    <app-page-header title="Order" backLink="/orders" backLabel="Orders" />

    @if (loading()) {
      <app-loading />
    } @else if (order(); as o) {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
          <section class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-lg font-semibold text-slate-900">{{ o.orderNumber }}</p>
                <p class="text-sm text-slate-500">Created {{ o.createdAt | appDate:true }}</p>
              </div>
              <div class="flex gap-2">
                <app-status-badge [status]="o.status" />
                <app-status-badge [status]="o.paymentStatus" />
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-slate-400">Customer</p>
                <p class="font-medium text-slate-800">{{ customerName(o) }}</p>
              </div>
              <div>
                <p class="text-slate-400">Created by</p>
                <p class="font-medium text-slate-800">{{ createdBy(o) }}</p>
              </div>
            </div>
            @if (o.notes) {
              <p class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{{ o.notes }}</p>
            }
          </section>

          <section class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <div class="border-b border-slate-100 px-5 py-3">
              <h3 class="text-sm font-semibold text-slate-900">Items</h3>
            </div>
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th class="px-5 py-2">Item</th>
                  <th class="px-5 py-2 text-right">Unit price</th>
                  <th class="px-5 py-2 text-center">Qty</th>
                  <th class="px-5 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of o.items; track item._id) {
                  <tr>
                    <td class="px-5 py-2.5 font-medium text-slate-800">{{ item.itemName }}</td>
                    <td class="px-5 py-2.5 text-right text-slate-600">{{ item.unitPrice | kes }}</td>
                    <td class="px-5 py-2.5 text-center text-slate-600">{{ item.quantity }}</td>
                    <td class="px-5 py-2.5 text-right font-medium text-slate-800">{{ item.subtotal | kes }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        </div>

        <aside class="space-y-4">
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h3 class="mb-3 text-sm font-semibold text-slate-900">Totals</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>{{ o.subtotal | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Discount</dt><dd>-{{ o.discount | kes }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd>+{{ o.tax | kes }}</dd></div>
              <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                <dt>Total</dt><dd>{{ o.total | kes }}</dd>
              </div>
            </dl>
          </div>

          @if (canTransit(o.status)) {
            <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <h3 class="mb-3 text-sm font-semibold text-slate-900">Update status</h3>
              <div class="flex flex-wrap gap-2">
                @for (s of nextStatuses(o.status); track s) {
                  <button type="button"
                    class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    (click)="setStatus(s)">{{ s }}</button>
                }
              </div>
            </div>
          }

          @if (o.status === 'PENDING') {
            <a routerLink="/invoices"
              class="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700">
              Create invoice
            </a>
          }

          @if (auth.isSuperAdmin() && o.status === 'PENDING') {
            <button type="button"
              class="w-full rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              (click)="deleteOpen = true">Delete order</button>
          }
        </aside>
      </div>
    }

    <app-confirm-dialog [open]="deleteOpen" title="Delete order" message="Only pending orders can be deleted."
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteOpen = false" />
  `,
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly order = signal<Order | null>(null);
  readonly deleting = signal(false);
  deleteOpen = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sales.getOrder(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }

  customerName(o: Order): string {
    const c = o.customerId;
    return c && typeof c === 'object' ? `${c.firstName} ${c.lastName} (${c.customerNumber})` : '—';
  }

  createdBy(o: Order): string {
    const u = o.createdBy;
    return u && typeof u === 'object' ? `${u.firstName} ${u.lastName}` : '—';
  }

  canTransit(status: OrderStatus): boolean {
    return status === 'PENDING' || status === 'PROCESSING';
  }

  nextStatuses(status: OrderStatus): OrderStatus[] {
    if (status === 'PENDING') return ['PROCESSING', 'COMPLETED', 'CANCELLED'];
    if (status === 'PROCESSING') return ['COMPLETED', 'CANCELLED'];
    return [];
  }

  setStatus(status: OrderStatus): void {
    const o = this.order();
    if (!o) return;
    this.sales.setOrderStatus(o._id, status).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.toast.success(`Order marked ${status}`);
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  doDelete(): void {
    const o = this.order();
    if (!o) return;
    this.deleting.set(true);
    this.sales.deleteOrder(o._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen = false;
        this.toast.success('Order deleted');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
