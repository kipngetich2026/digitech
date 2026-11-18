import { Component, OnInit, inject, signal } from '@angular/core';
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
import { errorMessage, ELEVATED_ROLES } from '../../core/models/api.models';
import { Order } from '../../core/models/order.models';
import { HasRoleDirective } from '../../core/directives/has-role.directive';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    RouterLink, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe, DatePipe, HasRoleDirective,
  ],
  template: `
    <app-page-header title="Orders" subtitle="Track sales orders">
      <a routerLink="/orders/new"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">+ New order</a>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search order #, customer…" />
      <div class="flex gap-1 text-xs">
        @for (f of statusFilters; track f) {
          <button type="button"
            class="rounded-full px-3 py-1 font-medium"
            [class.bg-indigo-600]="statusFilter() === f"
            [class.text-white]="statusFilter() === f"
            [class.bg-slate-100]="statusFilter() !== f"
            [class.text-slate-600]="statusFilter() !== f"
            (click)="statusFilter.set(f)">{{ f === 'ALL' ? 'All' : f }}</button>
        }
      </div>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No orders found" hint="Create an order to start recording sales.">
        <a routerLink="/orders/new" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">+ New order</a>
      </app-empty-state>
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Order</th>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Payment</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (o of filtered(); track o._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <a [routerLink]="['/orders', o._id]" class="font-medium text-slate-800 hover:text-indigo-600">
                    {{ o.orderNumber }}
                  </a>
                  <p class="text-xs text-slate-400">{{ o.items.length }} item(s)</p>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ customerName(o) }}</td>
                <td class="px-4 py-3 text-slate-500">{{ o.createdAt | appDate }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-800">{{ o.total | kes }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="o.status" /></td>
                <td class="px-4 py-3"><app-status-badge [status]="o.paymentStatus" /></td>
                <td class="px-4 py-3 text-right">
                  <a [routerLink]="['/orders', o._id]" class="mr-3 text-xs font-medium text-indigo-600 hover:underline">View</a>
                  @if (o.status === 'PENDING') {
                    <button *hasRole="ELEVATED_ROLES" type="button" class="text-xs font-medium text-rose-600 hover:underline"
                      (click)="askDelete(o)">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete order"
      [message]="'Delete order ' + (deleteTarget()?.orderNumber || '') + '? Only pending orders can be deleted.'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class OrderListComponent implements OnInit {
  protected readonly ELEVATED_ROLES = ELEVATED_ROLES;
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Order[]>([]);
  readonly query = signal('');
  readonly statusFilter = signal('ALL');
  readonly deleteTarget = signal<Order | null>(null);
  readonly deleting = signal(false);

  readonly statusFilters = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];

  ngOnInit(): void {
    this.sales.listOrders().subscribe({
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

  customerName(o: Order): string {
    const c = o.customerId;
    return c && typeof c === 'object' ? `${c.firstName} ${c.lastName}` : '—';
  }

  filtered(): Order[] {
    const q = this.query().toLowerCase().trim();
    const st = this.statusFilter();
    return this.items().filter((o) => {
      if (st !== 'ALL' && o.status !== st) return false;
      if (!q) return true;
      return [o.orderNumber, this.customerName(o)].some((v) => v.toLowerCase().includes(q));
    });
  }

  askDelete(o: Order): void {
    this.deleteTarget.set(o);
  }

  doDelete(): void {
    const o = this.deleteTarget();
    if (!o) return;
    this.deleting.set(true);
    this.sales.deleteOrder(o._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Order deleted');
        this.items.update((list) => list.filter((x) => x._id !== o._id));
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
