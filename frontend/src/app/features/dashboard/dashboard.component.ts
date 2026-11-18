import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { OverviewReport, RecentReport } from '../../core/models/report.models';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, KesPipe, StatusBadgeComponent, LoadingComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Dashboard" subtitle="Business snapshot across all branches" />

    @if (loading()) {
      <app-loading />
    } @else {
      @if (overview(); as o) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Revenue</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ o.finance.totalRevenue | kes }}</p>
            <p class="mt-1 text-xs text-slate-500">Net {{ o.finance.netIncome | kes }}</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Orders</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ o.orders.total }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ o.orders.pending }} pending · {{ o.orders.completed }} completed</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Outstanding</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ o.invoices.outstandingAmount | kes }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ o.invoices.unpaid }} unpaid invoices</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Low stock</p>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ o.products.lowStock }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ o.products.total }} products · stock {{ o.inventory.stockValue | kes }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Customers</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ o.customers.total }}</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Products</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ o.products.total }}</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Services</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ o.services.total }}</p>
          </div>
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Expenses</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ o.finance.totalExpenses | kes }}</p>
          </div>
        </div>
      }

      <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 class="text-sm font-semibold text-slate-900">Recent orders</h2>
            <a routerLink="/orders" class="text-xs font-medium text-indigo-600 hover:underline">View all</a>
          </div>
          <div class="divide-y divide-slate-100">
            @for (order of recent()?.orders ?? []; track order.orderNumber) {
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ order.orderNumber }}</p>
                  <p class="text-xs text-slate-500">
                    {{ order.customerId.firstName }} {{ order.customerId.lastName }} · {{ order.createdAt | appDate }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-slate-900">{{ order.total | kes }}</span>
                  <app-status-badge [status]="order.status" />
                </div>
              </div>
            } @empty {
              <p class="px-5 py-8 text-center text-sm text-slate-400">No orders yet</p>
            }
          </div>
        </section>

        <section class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 class="text-sm font-semibold text-slate-900">Recent payments</h2>
            <a routerLink="/payments" class="text-xs font-medium text-indigo-600 hover:underline">View all</a>
          </div>
          <div class="divide-y divide-slate-100">
            @for (p of recent()?.payments ?? []; track p.paymentNumber) {
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ p.paymentNumber }}</p>
                  <p class="text-xs text-slate-500">{{ p.invoiceId.invoiceNumber }} · {{ p.method }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-slate-900">{{ p.amount | kes }}</span>
                  <app-status-badge [status]="p.status" />
                </div>
              </div>
            } @empty {
              <p class="px-5 py-8 text-center text-sm text-slate-400">No payments yet</p>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly reports = inject(ReportsService);

  readonly loading = signal(true);
  readonly overview = signal<OverviewReport | null>(null);
  readonly recent = signal<RecentReport | null>(null);

  ngOnInit(): void {
    this.reports.overview().subscribe({
      next: (o) => {
        this.overview.set(o);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.reports.recent().subscribe({ next: (r) => this.recent.set(r) });
  }
}
