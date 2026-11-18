import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Product } from '../../core/models/catalog.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FormsModule, RouterLink, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe,
  ],
  template: `
    <app-page-header title="Products" subtitle="Sellable inventory items">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New product</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search by name, SKU, category…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} products</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No products found" hint="Add products to start selling and tracking stock." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3 text-right">Price</th>
              <th class="px-4 py-3 text-right">Stock</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (p of filtered(); track p._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <a [routerLink]="['/products', p._id]" class="font-medium text-slate-800 hover:text-indigo-600">{{ p.name }}</a>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ p.sku }}</td>
                <td class="px-4 py-3 text-slate-500">{{ p.category }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-800">{{ p.sellingPrice | kes }}</td>
                <td class="px-4 py-3 text-right" [class.text-rose-600]="p.stockQuantity <= p.reorderLevel">
                  {{ p.stockQuantity }}
                </td>
                <td class="px-4 py-3"><app-status-badge [status]="p.isActive ? 'ACTIVE' : 'INACTIVE'" /></td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="mr-3 text-xs font-medium text-indigo-600 hover:underline"
                    (click)="openEdit(p)">Edit</button>
                  <button type="button" class="mr-3 text-xs font-medium text-slate-500 hover:underline"
                    (click)="toggleStatus(p)">{{ p.isActive ? 'Disable' : 'Enable' }}</button>
                  @if (auth.isSuperAdmin()) {
                    <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
                      (click)="askDelete(p)">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="closeModal()">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit product' : 'New product' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">SKU</label>
                <input name="sku" required minlength="2" maxlength="50" [(ngModel)]="form.sku"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <input name="category" required maxlength="100" [(ngModel)]="form.category"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input name="name" required minlength="2" maxlength="100" [(ngModel)]="form.name"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea name="description" rows="2" maxlength="500" [(ngModel)]="form.description"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Selling price</label>
                <input name="sellingPrice" type="number" min="0" step="0.01" required [(ngModel)]="form.sellingPrice"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Cost price</label>
                <input name="costPrice" type="number" min="0" step="0.01" required [(ngModel)]="form.costPrice"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Stock quantity</label>
                <input name="stockQuantity" type="number" min="0" [(ngModel)]="form.stockQuantity"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Reorder level</label>
                <input name="reorderLevel" type="number" min="0" [(ngModel)]="form.reorderLevel"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
            </div>
            @if (formError()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ formError() }}</p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                (click)="closeModal()">Cancel</button>
              <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete product"
      [message]="'Delete product ' + (deleteTarget()?.name || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class ProductListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly items = signal<Product[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Product | null>(null);
  readonly deleting = signal(false);

  form: {
    sku: string; name: string; description: string; category: string;
    sellingPrice: number; costPrice: number; stockQuantity: number; reorderLevel: number;
  } = { sku: '', name: '', description: '', category: '', sellingPrice: 0, costPrice: 0, stockQuantity: 0, reorderLevel: 5 };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listProducts().subscribe({
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

  filtered(): Product[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((p) =>
      [p.name, p.sku, p.category].some((v) => v.toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { sku: '', name: '', description: '', category: '', sellingPrice: 0, costPrice: 0, stockQuantity: 0, reorderLevel: 5 };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(p: Product): void {
    this.editingId.set(p._id);
    this.form = {
      sku: p.sku, name: p.name, description: p.description ?? '', category: p.category,
      sellingPrice: p.sellingPrice, costPrice: p.costPrice,
      stockQuantity: p.stockQuantity, reorderLevel: p.reorderLevel,
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set('');

    const payload = {
      sku: this.form.sku.trim(),
      name: this.form.name.trim(),
      description: this.form.description.trim() || undefined,
      category: this.form.category.trim(),
      sellingPrice: Number(this.form.sellingPrice),
      costPrice: Number(this.form.costPrice),
      stockQuantity: Number(this.form.stockQuantity) || 0,
      reorderLevel: Number(this.form.reorderLevel) || 0,
    };

    const req$ = this.editingId()
      ? this.catalog.updateProduct(this.editingId()!, payload)
      : this.catalog.createProduct(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Product updated' : 'Product created');
        this.closeModal();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  toggleStatus(p: Product): void {
    this.catalog.setProductStatus(p._id, !p.isActive).subscribe({
      next: () => {
        this.toast.success('Product status updated');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(p: Product): void {
    this.deleteTarget.set(p);
  }

  doDelete(): void {
    const p = this.deleteTarget();
    if (!p) return;
    this.deleting.set(true);
    this.catalog.deleteProduct(p._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Product deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
