import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Customer } from '../../core/models/customer.models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <app-page-header title="Customers" subtitle="Manage customer records">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New customer</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search customers…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} customers</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No customers found" hint="Create your first customer to get started.">
        <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          (click)="openCreate()">+ New customer</button>
      </app-empty-state>
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Number</th>
              <th class="px-4 py-3">Contact</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (c of filtered(); track c._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3 font-medium text-slate-800">{{ c.firstName }} {{ c.lastName }}</td>
                <td class="px-4 py-3 text-slate-500">{{ c.customerNumber }}</td>
                <td class="px-4 py-3 text-slate-500">
                  {{ c.email || '—' }}<br /><span class="text-xs">{{ c.phone || '' }}</span>
                </td>
                <td class="px-4 py-3">
                  <app-status-badge [status]="c.isActive ? 'ACTIVE' : 'INACTIVE'" />
                </td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="mr-3 text-xs font-medium text-indigo-600 hover:underline"
                    (click)="openEdit(c)">Edit</button>
                  <button type="button" class="mr-3 text-xs font-medium text-slate-500 hover:underline"
                    (click)="toggleStatus(c)">{{ c.isActive ? 'Deactivate' : 'Activate' }}</button>
                  <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
    (click)="askDelete(c)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Create / edit modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="closeModal()">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit customer' : 'New customer' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">First name</label>
                <input name="firstName" required minlength="2" [(ngModel)]="form.firstName"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Last name</label>
                <input name="lastName" required minlength="2" [(ngModel)]="form.lastName"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" email [(ngModel)]="form.email"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input name="phone" [(ngModel)]="form.phone"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <input name="address" [(ngModel)]="form.address"
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

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete customer"
      [message]="'Delete ' + (deleteTarget()?.firstName || '') + ' ' + (deleteTarget()?.lastName || '') + '? This cannot be undone.'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class CustomerListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Customer[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Customer | null>(null);
  readonly deleting = signal(false);

  form: { firstName: string; lastName: string; email: string; phone: string; address: string } = {
    firstName: '', lastName: '', email: '', phone: '', address: '',
  };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listCustomers().subscribe({
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

  filtered(): Customer[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((c) =>
      [c.firstName, c.lastName, c.email, c.phone, c.customerNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { firstName: '', lastName: '', email: '', phone: '', address: '' };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(c: Customer): void {
    this.editingId.set(c._id);
    this.form = {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
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
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim() || undefined,
      phone: this.form.phone.trim() || undefined,
      address: this.form.address.trim() || undefined,
    };

    const req$ = this.editingId()
      ? this.catalog.updateCustomer(this.editingId()!, payload)
      : this.catalog.createCustomer(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Customer updated' : 'Customer created');
        this.closeModal();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  toggleStatus(c: Customer): void {
    this.catalog.setCustomerStatus(c._id, !c.isActive).subscribe({
      next: () => {
        this.toast.success(c.isActive ? 'Customer deactivated' : 'Customer activated');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(c: Customer): void {
    this.deleteTarget.set(c);
  }

  doDelete(): void {
    const c = this.deleteTarget();
    if (!c) return;
    this.deleting.set(true);
    this.catalog.deleteCustomer(c._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Customer deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
