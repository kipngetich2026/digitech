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
import { Branch } from '../../core/models/branch.models';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    FormsModule, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent,
  ],
  template: `
    <app-page-header title="Branches" subtitle="Manage branch locations">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New branch</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search branches…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} branches</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No branches found" />
    } @else {
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (b of filtered(); track b._id) {
          <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-mono text-xs text-slate-400">{{ b.code }}</p>
                <h3 class="mt-0.5 font-semibold text-slate-900">{{ b.name }}</h3>
              </div>
              <app-status-badge [status]="b.isActive ? 'ACTIVE' : 'INACTIVE'" />
            </div>
            <div class="mt-3 space-y-1 text-sm text-slate-500">
              @if (b.address) { <p>{{ b.address }}</p> }
              @if (b.phone) { <p>{{ b.phone }}</p> }
              @if (b.email) { <p>{{ b.email }}</p> }
            </div>
            <div class="mt-4 flex gap-3 text-xs font-medium">
              <button type="button" class="text-indigo-600 hover:underline" (click)="openEdit(b)">Edit</button>
              <button type="button" class="text-slate-500 hover:underline" (click)="toggleStatus(b)">
                {{ b.isActive ? 'Deactivate' : 'Activate' }}
              </button>
              <button type="button" class="text-rose-600 hover:underline" (click)="askDelete(b)">Delete</button>
            </div>
          </div>
        }
      </div>
    }

    @if (modalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="modalOpen.set(false)">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit branch' : 'New branch' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input name="name" required minlength="2" maxlength="100" [(ngModel)]="form.name"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Code</label>
                <input name="code" required minlength="2" maxlength="20" [(ngModel)]="form.code"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <input name="address" maxlength="255" [(ngModel)]="form.address"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input name="phone" maxlength="30" [(ngModel)]="form.phone"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input name="email" type="email" email [(ngModel)]="form.email"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            @if (formError()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ formError() }}</p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                (click)="modalOpen.set(false)">Cancel</button>
              <button type="submit" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete branch"
      [message]="'Delete branch ' + (deleteTarget()?.name || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class BranchListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Branch[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Branch | null>(null);
  readonly deleting = signal(false);

  form = { name: '', code: '', address: '', phone: '', email: '' };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listBranches().subscribe({
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

  filtered(): Branch[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((b) =>
      [b.name, b.code, b.address ?? '', b.email ?? ''].some((v) => v.toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { name: '', code: '', address: '', phone: '', email: '' };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(b: Branch): void {
    this.editingId.set(b._id);
    this.form = {
      name: b.name, code: b.code, address: b.address ?? '',
      phone: b.phone ?? '', email: b.email ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set('');

    const payload = {
      name: this.form.name.trim(),
      code: this.form.code.trim(),
      address: this.form.address.trim() || undefined,
      phone: this.form.phone.trim() || undefined,
      email: this.form.email.trim() || undefined,
    };

    const req$ = this.editingId()
      ? this.catalog.updateBranch(this.editingId()!, payload)
      : this.catalog.createBranch(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Branch updated' : 'Branch created');
        this.modalOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  toggleStatus(b: Branch): void {
    this.catalog.setBranchStatus(b._id, !b.isActive).subscribe({
      next: () => {
        this.toast.success('Branch status updated');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(b: Branch): void {
    this.deleteTarget.set(b);
  }

  doDelete(): void {
    const b = this.deleteTarget();
    if (!b) return;
    this.deleting.set(true);
    this.catalog.deleteBranch(b._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Branch deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
