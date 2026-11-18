import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Service } from '../../core/models/catalog.models';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    FormsModule, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe,
  ],
  template: `
    <app-page-header title="Services" subtitle="Service offerings">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New service</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search services…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} services</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No services found" hint="Add services you offer to customers." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Service</th>
              <th class="px-4 py-3">Code</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3 text-right">Price</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (s of filtered(); track s._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{{ s.name }}</p>
                  <p class="text-xs text-slate-400">{{ s.description || '' }}</p>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ s.serviceCode }}</td>
                <td class="px-4 py-3 text-slate-500">{{ s.category }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-800">{{ s.price | kes }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="s.isActive ? 'ACTIVE' : 'INACTIVE'" /></td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="mr-3 text-xs font-medium text-indigo-600 hover:underline"
                    (click)="openEdit(s)">Edit</button>
                  <button type="button" class="mr-3 text-xs font-medium text-slate-500 hover:underline"
                    (click)="toggleStatus(s)">{{ s.isActive ? 'Disable' : 'Enable' }}</button>
                  @if (auth.isSuperAdmin()) {
                    <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
                      (click)="askDelete(s)">Delete</button>
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
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit service' : 'New service' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Service code</label>
                <input name="serviceCode" required minlength="2" maxlength="50" [(ngModel)]="form.serviceCode"
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
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Price</label>
              <input name="price" type="number" min="0" step="0.01" required [(ngModel)]="form.price"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
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

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete service"
      [message]="'Delete service ' + (deleteTarget()?.name || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class ServiceListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly items = signal<Service[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Service | null>(null);
  readonly deleting = signal(false);

  form = { serviceCode: '', name: '', description: '', category: '', price: 0 };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listServices().subscribe({
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

  filtered(): Service[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((s) =>
      [s.name, s.serviceCode, s.category].some((v) => v.toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { serviceCode: '', name: '', description: '', category: '', price: 0 };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(s: Service): void {
    this.editingId.set(s._id);
    this.form = {
      serviceCode: s.serviceCode, name: s.name,
      description: s.description ?? '', category: s.category, price: s.price,
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
      serviceCode: this.form.serviceCode.trim(),
      name: this.form.name.trim(),
      description: this.form.description.trim() || undefined,
      category: this.form.category.trim(),
      price: Number(this.form.price),
    };

    const req$ = this.editingId()
      ? this.catalog.updateService(this.editingId()!, payload)
      : this.catalog.createService(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Service updated' : 'Service created');
        this.closeModal();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  toggleStatus(s: Service): void {
    this.catalog.setServiceStatus(s._id, !s.isActive).subscribe({
      next: () => {
        this.toast.success('Service status updated');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(s: Service): void {
    this.deleteTarget.set(s);
  }

  doDelete(): void {
    const s = this.deleteTarget();
    if (!s) return;
    this.deleting.set(true);
    this.catalog.deleteService(s._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Service deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
