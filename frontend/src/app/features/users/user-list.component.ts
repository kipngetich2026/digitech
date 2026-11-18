import { Component, OnInit, inject, signal } from '@angular/core';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { User } from '../../core/models/auth.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, DatePipe,
  ],
  template: `
    <app-page-header title="Users" subtitle="All registered accounts (create via registration)" />

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search users…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} users</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No users found" />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">User</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Joined</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (u of filtered(); track u._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{{ u.firstName }} {{ u.lastName }}</p>
                  <p class="text-xs text-slate-400">{{ u.email }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                    [class.bg-indigo-50]="u.role === 'SUPER_ADMIN'"
                    [class.text-indigo-700]="u.role === 'SUPER_ADMIN'"
                    [class.bg-slate-100]="u.role !== 'SUPER_ADMIN'"
                    [class.text-slate-600]="u.role !== 'SUPER_ADMIN'">{{ u.role }}</span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ u.phone || '—' }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="u.isActive ? 'ACTIVE' : 'INACTIVE'" /></td>
                <td class="px-4 py-3 text-slate-500">{{ u.createdAt | appDate }}</td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="mr-3 text-xs font-medium text-slate-500 hover:underline"
                    (click)="toggleStatus(u)">{{ u.isActive ? 'Deactivate' : 'Activate' }}</button>
                  <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
                    (click)="askDelete(u)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete user"
      [message]="'Delete user ' + (deleteTarget()?.email || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class UserListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<User[]>([]);
  readonly query = signal('');
  readonly deleteTarget = signal<User | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listUsers().subscribe({
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

  filtered(): User[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((u) =>
      [u.firstName, u.lastName, u.email, u.role].some((v) => v.toLowerCase().includes(q)),
    );
  }

  toggleStatus(u: User): void {
    this.catalog.updateUser(u._id, {}).subscribe({
      next: () => {
        // Backend has no dedicated status endpoint for users — PATCH empty is a no-op.
        // Use isActive toggle via update is not supported; show info.
        this.toast.info('User status changes are not exposed by the API');
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(u: User): void {
    this.deleteTarget.set(u);
  }

  doDelete(): void {
    const u = this.deleteTarget();
    if (!u) return;
    this.deleting.set(true);
    this.catalog.deleteUser(u._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('User deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
