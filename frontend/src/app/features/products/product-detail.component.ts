import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { InventoryService } from '../../core/services/inventory.service';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { Product } from '../../core/models/catalog.models';
import { StockMovement } from '../../core/models/inventory.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, LoadingComponent, StatusBadgeComponent, KesPipe, DatePipe],
  template: `
    <app-page-header title="Product" backLink="/products" backLabel="Products" />

    @if (loading()) {
      <app-loading />
    } @else if (product(); as p) {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="rounded-xl bg-white p-6 ring-1 ring-slate-200 lg:col-span-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-mono text-xs text-slate-400">{{ p.sku }}</p>
              <h2 class="mt-1 text-lg font-semibold text-slate-900">{{ p.name }}</h2>
            </div>
            <app-status-badge [status]="p.isActive ? 'ACTIVE' : 'INACTIVE'" />
          </div>
          <p class="mt-2 text-sm text-slate-500">{{ p.description || 'No description' }}</p>

          <dl class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between"><dt class="text-slate-400">Category</dt><dd class="font-medium">{{ p.category }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Selling price</dt><dd class="font-medium">{{ p.sellingPrice | kes }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Cost price</dt><dd class="font-medium">{{ p.costPrice | kes }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Stock</dt>
              <dd class="font-medium" [class.text-rose-600]="p.stockQuantity <= p.reorderLevel">{{ p.stockQuantity }} / reorder at {{ p.reorderLevel }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Stock value</dt>
              <dd class="font-medium">{{ p.stockQuantity * p.sellingPrice | kes }}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-400">Created</dt><dd class="font-medium">{{ p.createdAt | appDate }}</dd></div>
          </dl>

          <a routerLink="/inventory"
            class="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Manage stock
          </a>
        </div>

        <div class="rounded-xl bg-white ring-1 ring-slate-200 lg:col-span-2">
          <div class="border-b border-slate-100 px-5 py-4">
            <h3 class="text-sm font-semibold text-slate-900">Stock movements</h3>
          </div>
          @if (movementsLoading()) {
            <app-loading label="Loading movements…" />
          } @else {
            <div class="divide-y divide-slate-100">
              @for (m of movements(); track m._id) {
                <div class="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p class="font-medium text-slate-800">{{ m.movementNumber }}</p>
                    <p class="text-xs text-slate-500">{{ m.movementType }} · {{ m.createdAt | appDate:true }}</p>
                    @if (m.reason) { <p class="text-xs text-slate-400">{{ m.reason }}</p> }
                  </div>
                  <div class="text-right">
                    <p class="font-medium" [class.text-emerald-600]="m.newQuantity > m.previousQuantity"
                      [class.text-rose-600]="m.newQuantity < m.previousQuantity">
                      {{ m.previousQuantity }} → {{ m.newQuantity }}
                    </p>
                    <p class="text-xs text-slate-400">qty {{ m.quantity }}</p>
                  </div>
                </div>
              } @empty {
                <p class="px-5 py-8 text-center text-sm text-slate-400">No movements recorded</p>
              }
            </div>
          }
        </div>
      </div>
    } @else {
      <p class="text-sm text-slate-500">Product not found.</p>
    }
  `,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly inventory = inject(InventoryService);

  readonly loading = signal(true);
  readonly movementsLoading = signal(true);
  readonly product = signal<Product | null>(null);
  readonly movements = signal<StockMovement[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    // Reuse list endpoint? There's GET /products/:id
    this.catalog.listProducts().subscribe({
      next: (list) => {
        this.product.set(list.find((p) => p._id === id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.inventory.productMovements(id).subscribe({
      next: (list) => {
        this.movements.set(list);
        this.movementsLoading.set(false);
      },
      error: () => this.movementsLoading.set(false),
    });
  }
}
