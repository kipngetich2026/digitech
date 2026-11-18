import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { errorMessage } from '../../core/models/api.models';
import { Customer } from '../../core/models/customer.models';
import { Product, Service } from '../../core/models/catalog.models';
import { CreateOrderItemRequest } from '../../core/models/order.models';

interface Line extends CreateOrderItemRequest {
  kind: 'product' | 'service';
  label: string;
  unitPrice: number;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, KesPipe],
  template: `
    <app-page-header title="New order" subtitle="Prices are computed from the catalog on the server"
      backLink="/orders" backLabel="Orders" />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <section class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Customer</h2>
          <select name="customerId" required [(ngModel)]="customerId"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none">
            <option value="" disabled>Select customer</option>
            @for (c of customers(); track c._id) {
              <option [value]="c._id">{{ c.firstName }} {{ c.lastName }} ({{ c.customerNumber }})</option>
            }
          </select>
        </section>

        <section class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-900">Line items</h2>
            <div class="flex gap-2">
              <select #prodSel class="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                <option value="">Add product…</option>
                @for (p of products(); track p._id) {
                  <option [value]="p._id">{{ p.name }} — {{ p.sellingPrice }}</option>
                }
              </select>
              <button type="button" class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                (click)="addProduct(prodSel.value); prodSel.value = ''">Add</button>

              <select #svcSel class="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
                <option value="">Add service…</option>
                @for (s of services(); track s._id) {
                  <option [value]="s._id">{{ s.name }} — {{ s.price }}</option>
                }
              </select>
              <button type="button" class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                (click)="addService(svcSel.value); svcSel.value = ''">Add</button>
            </div>
          </div>

          @if (lines().length === 0) {
            <p class="py-6 text-center text-sm text-slate-400">No items yet — add a product or service above.</p>
          } @else {
            <table class="min-w-full text-sm">
              <thead class="text-left text-xs font-medium uppercase text-slate-400">
                <tr>
                  <th class="pb-2">Item</th>
                  <th class="pb-2 text-right">Unit</th>
                  <th class="pb-2 text-center">Qty</th>
                  <th class="pb-2 text-right">Subtotal</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (line of lines(); track $index) {
                  <tr>
                    <td class="py-2 font-medium text-slate-800">{{ line.label }}</td>
                    <td class="py-2 text-right text-slate-600">{{ line.unitPrice | kes }}</td>
                    <td class="py-2 text-center">
                      <input type="number" min="1" step="1" [ngModel]="$any(line).quantity"
                        (ngModelChange)="setQty($index, $event)"
                        class="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm" />
                    </td>
                    <td class="py-2 text-right font-medium">{{ line.unitPrice * (line.quantity || 0) | kes }}</td>
                    <td class="py-2 text-right">
                      <button type="button" class="text-xs text-rose-500 hover:underline" (click)="removeLine($index)">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>

        <section class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Adjustments</h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm text-slate-600">Discount</label>
              <input name="discount" type="number" min="0" step="0.01" [(ngModel)]="discount"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-slate-600">Tax</label>
              <input name="tax" type="number" min="0" step="0.01" [(ngModel)]="tax"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <label class="mb-1 mt-3 block text-sm text-slate-600">Notes</label>
          <textarea name="notes" rows="2" maxlength="1000" [(ngModel)]="notes"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"></textarea>
        </section>
      </div>

      <aside class="lg:col-span-1">
        <div class="sticky top-24 rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h2 class="mb-3 text-sm font-semibold text-slate-900">Summary</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">Subtotal</dt><dd>{{ subtotal() | kes }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Discount</dt><dd>-{{ discount || 0 | kes }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Tax</dt><dd>+{{ tax || 0 | kes }}</dd></div>
            <div class="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
              <dt>Total</dt><dd>{{ total() | kes }}</dd>
            </div>
          </dl>

          @if (error()) {
            <p class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{{ error() }}</p>
          }

          <button type="button"
            class="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="saving() || !customerId || lines().length === 0"
            (click)="submit()">
            {{ saving() ? 'Creating…' : 'Create order' }}
          </button>
          <a routerLink="/orders" class="mt-2 block text-center text-sm text-slate-500 hover:underline">Cancel</a>
        </div>
      </aside>
    </div>
  `,
})
export class OrderCreateComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly sales = inject(SalesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly services = signal<Service[]>([]);
  readonly lines = signal<Line[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');

  customerId = '';
  discount = 0;
  tax = 0;
  notes = '';

  ngOnInit(): void {
    this.catalog.listCustomers().subscribe({ next: (l) => this.customers.set(l) });
    this.catalog.listProducts().subscribe({ next: (l) => this.products.set(l.filter((p) => p.isActive)) });
    this.catalog.listServices().subscribe({ next: (l) => this.services.set(l.filter((s) => s.isActive)) });
  }

  addProduct(id: string): void {
    const p = this.products().find((x) => x._id === id);
    if (!p) return;
    this.lines.update((list) => [
      ...list,
      { kind: 'product', productId: p._id, quantity: 1, label: p.name, unitPrice: p.sellingPrice },
    ]);
  }

  addService(id: string): void {
    const s = this.services().find((x) => x._id === id);
    if (!s) return;
    this.lines.update((list) => [
      ...list,
      { kind: 'service', serviceId: s._id, quantity: 1, label: s.name, unitPrice: s.price },
    ]);
  }

  setQty(index: number, qty: number): void {
    this.lines.update((list) =>
      list.map((l, i) => (i === index ? { ...l, quantity: Math.max(1, Math.floor(Number(qty) || 1)) } : l)),
    );
  }

  removeLine(index: number): void {
    this.lines.update((list) => list.filter((_, i) => i !== index));
  }

  subtotal(): number {
    return this.lines().reduce((sum, l) => sum + l.unitPrice * (l.quantity || 0), 0);
  }

  total(): number {
    return Math.max(0, this.subtotal() - (Number(this.discount) || 0) + (Number(this.tax) || 0));
  }

  submit(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');

    const items = this.lines().map((l) => ({
      productId: l.productId,
      serviceId: l.serviceId,
      quantity: l.quantity,
    }));

    this.sales
      .createOrder({
        customerId: this.customerId,
        items,
        discount: Number(this.discount) || 0,
        tax: Number(this.tax) || 0,
        notes: this.notes.trim() || undefined,
      })
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.toast.success(`Order ${order.orderNumber} created`);
          this.router.navigate(['/orders', order._id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(errorMessage(err.error ?? err));
        },
      });
  }
}
