import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { errorMessage } from '../../core/models/api.models';
import {
  CreateStockMovementRequest,
  InventorySummary,
  LowStockItem,
  StockListItem,
  StockMovement,
} from '../../core/models/inventory.models';
import { Product } from '../../core/models/catalog.models';

type Tab = 'summary' | 'stock' | 'low' | 'out' | 'movements';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, LoadingComponent, EmptyStateComponent, KesPipe, DatePipe],
  template: `
    <app-page-header title="Inventory" subtitle="Stock levels, movements and reorder alerts">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openMovement()">+ Stock movement</button>
    </app-page-header>

    <div class="mb-5 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 text-sm">
      @for (t of tabs; track t.id) {
        <button type="button"
          class="rounded-md px-4 py-1.5 font-medium"
          [class.bg-white]="tab() === t.id"
          [class.shadow-sm]="tab() === t.id"
          [class.text-slate-900]="tab() === t.id"
          [class.text-slate-500]="tab() !== t.id"
          (click)="selectTab(t.id)">{{ t.label }}</button>
      }
    </div>

    @if (loading()) {
      <app-loading />
    } @else {
      @switch (tab()) {
        @case ('summary') {
          @if (summary(); as s) {
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Total products</p>
                <p class="mt-2 text-2xl font-semibold">{{ s.totalProducts }}</p>
                <p class="text-xs text-slate-500">{{ s.activeProducts }} active</p>
              </div>
              <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Stock value</p>
                <p class="mt-2 text-2xl font-semibold">{{ s.stockValue | kes }}</p>
                <p class="text-xs text-slate-500">Cost {{ s.costValue | kes }}</p>
              </div>
              <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Alerts</p>
                <p class="mt-2 text-2xl font-semibold text-amber-600">{{ s.lowStockProducts }}</p>
                <p class="text-xs text-slate-500">{{ s.outOfStockProducts }} out of stock</p>
              </div>
            </div>
          }
        }
        @case ('stock') {
          @if (stock().length === 0) {
            <app-empty-state title="No stock records" />
          } @else {
            <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Product</th>
                    <th class="px-4 py-3">SKU</th>
                    <th class="px-4 py-3 text-right">Sell</th>
                    <th class="px-4 py-3 text-right">Cost</th>
                    <th class="px-4 py-3 text-right">Qty</th>
                    <th class="px-4 py-3 text-right">Reorder</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of stock(); track p._id) {
                    <tr class="hover:bg-slate-50/60">
                      <td class="px-4 py-3 font-medium text-slate-800">{{ p.name }}</td>
                      <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ p.sku }}</td>
                      <td class="px-4 py-3 text-right">{{ p.sellingPrice | kes }}</td>
                      <td class="px-4 py-3 text-right text-slate-500">{{ p.costPrice | kes }}</td>
                      <td class="px-4 py-3 text-right font-medium"
                        [class.text-rose-600]="p.stockQuantity <= p.reorderLevel">{{ p.stockQuantity }}</td>
                      <td class="px-4 py-3 text-right text-slate-500">{{ p.reorderLevel }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
        @case ('low') {
          @if (low().length === 0) {
            <app-empty-state title="No low-stock products" hint="Everything is above its reorder level." icon="✅" />
          } @else {
            <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Product</th>
                    <th class="px-4 py-3">SKU</th>
                    <th class="px-4 py-3 text-right">Qty</th>
                    <th class="px-4 py-3 text-right">Reorder at</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of low(); track p._id) {
                    <tr>
                      <td class="px-4 py-3 font-medium text-slate-800">{{ p.name }}</td>
                      <td class="px-4 py-3 font-mono text-xs">{{ p.sku }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-rose-600">{{ p.stockQuantity }}</td>
                      <td class="px-4 py-3 text-right text-slate-500">{{ p.reorderLevel }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
        @case ('out') {
          @if (out().length === 0) {
            <app-empty-state title="No out-of-stock products" icon="✅" />
          } @else {
            <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Product</th>
                    <th class="px-4 py-3">SKU</th>
                    <th class="px-4 py-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of out(); track p._id) {
                    <tr>
                      <td class="px-4 py-3 font-medium text-slate-800">{{ p.name }}</td>
                      <td class="px-4 py-3 font-mono text-xs">{{ p.sku }}</td>
                      <td class="px-4 py-3 text-right font-semibold text-rose-600">0</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
        @case ('movements') {
          @if (movements().length === 0) {
            <app-empty-state title="No stock movements yet" />
          } @else {
            <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Movement</th>
                    <th class="px-4 py-3">Product</th>
                    <th class="px-4 py-3">Type</th>
                    <th class="px-4 py-3 text-center">Qty</th>
                    <th class="px-4 py-3 text-center">Change</th>
                    <th class="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (m of movements(); track m._id) {
                    <tr>
                      <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ m.movementNumber }}</td>
                      <td class="px-4 py-3 font-medium text-slate-800">{{ productName(m) }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ m.movementType }}</td>
                      <td class="px-4 py-3 text-center">{{ m.quantity }}</td>
                      <td class="px-4 py-3 text-center font-medium"
                        [class.text-emerald-600]="m.newQuantity > m.previousQuantity"
                        [class.text-rose-600]="m.newQuantity < m.previousQuantity">
                        {{ m.previousQuantity }} → {{ m.newQuantity }}
                      </td>
                      <td class="px-4 py-3 text-slate-500">{{ m.createdAt | appDate:true }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    }

    @if (movementOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="movementOpen.set(false)">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">Stock movement</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="saveMovement()" #f="ngForm">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Product</label>
              <select name="productId" required [(ngModel)]="movementForm.productId"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="" disabled>Select product</option>
                @for (p of products(); track p._id) {
                  <option [value]="p._id">{{ p.name }} ({{ p.stockQuantity }} in stock)</option>
                }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Type</label>
                <select name="movementType" required [(ngModel)]="movementForm.movementType"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="STOCK_IN">Stock in</option>
                  <option value="STOCK_OUT">Stock out</option>
                  <option value="RETURN">Return</option>
                  <option value="ADJUSTMENT">Adjustment (absolute qty)</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
                <input name="quantity" type="number" min="1" required [(ngModel)]="movementForm.quantity"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Reason</label>
              <input name="reason" maxlength="500" [(ngModel)]="movementForm.reason"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Reference</label>
              <input name="reference" maxlength="100" [(ngModel)]="movementForm.reference"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            @if (movementError()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ movementError() }}</p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                (click)="movementOpen.set(false)">Cancel</button>
              <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save movement' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class InventoryComponent implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly tab = signal<Tab>('summary');
  readonly summary = signal<InventorySummary | null>(null);
  readonly stock = signal<StockListItem[]>([]);
  readonly low = signal<LowStockItem[]>([]);
  readonly out = signal<LowStockItem[]>([]);
  readonly movements = signal<StockMovement[]>([]);
  readonly products = signal<Product[]>([]);

  readonly movementOpen = signal(false);
  readonly saving = signal(false);
  readonly movementError = signal('');

  readonly tabs: Array<{ id: Tab; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'stock', label: 'Stock' },
    { id: 'low', label: 'Low stock' },
    { id: 'out', label: 'Out of stock' },
    { id: 'movements', label: 'Movements' },
  ];

  movementForm: CreateStockMovementRequest = {
    productId: '',
    movementType: 'STOCK_IN',
    quantity: 1,
    reason: '',
    reference: '',
  };

  ngOnInit(): void {
    this.loadAll();
    this.catalog.listProducts().subscribe({ next: (l) => this.products.set(l.filter((p) => p.isActive)) });
  }

  loadAll(): void {
    this.loading.set(true);
    let done = 0;
    const finish = () => {
      if (++done === 5) this.loading.set(false);
    };

    this.inventory.summary().subscribe({ next: (s) => { this.summary.set(s); finish(); }, error: finish });
    this.inventory.stock().subscribe({ next: (l) => { this.stock.set(l); finish(); }, error: finish });
    this.inventory.lowStock().subscribe({ next: (l) => { this.low.set(l); finish(); }, error: finish });
    this.inventory.outOfStock().subscribe({ next: (l) => { this.out.set(l); finish(); }, error: finish });
    this.inventory.movements().subscribe({ next: (l) => { this.movements.set(l); finish(); }, error: finish });
  }

  selectTab(t: Tab): void {
    this.tab.set(t);
  }

  productName(m: StockMovement): string {
    const p = m.productId;
    return p && typeof p === 'object' ? p.name : '—';
  }

  openMovement(): void {
    this.movementForm = { productId: '', movementType: 'STOCK_IN', quantity: 1, reason: '', reference: '' };
    this.movementError.set('');
    this.movementOpen.set(true);
  }

  saveMovement(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.movementError.set('');

    this.inventory.createMovement({
      productId: this.movementForm.productId,
      movementType: this.movementForm.movementType,
      quantity: Number(this.movementForm.quantity),
      reason: this.movementForm.reason?.trim() || undefined,
      reference: this.movementForm.reference?.trim() || undefined,
    }).subscribe({
      next: (m) => {
        this.saving.set(false);
        this.movementOpen.set(false);
        this.toast.success(`Movement ${m.movementNumber} recorded`);
        this.loadAll();
        this.catalog.listProducts().subscribe({ next: (l) => this.products.set(l.filter((p) => p.isActive)) });
      },
      error: (err) => {
        this.saving.set(false);
        this.movementError.set(errorMessage(err.error ?? err));
      },
    });
  }
}
