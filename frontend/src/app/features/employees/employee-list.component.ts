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
import { Employee, EmploymentType } from '../../core/models/catalog.models';
import { User } from '../../core/models/auth.models';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    FormsModule, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe,
  ],
  template: `
    <app-page-header title="Employees" subtitle="Link users to employment records">
      @if (auth.isSuperAdmin()) {
        <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          (click)="openCreate()">+ New employee</button>
      }
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search employees…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} employees</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No employees yet" hint="Create employee records for your staff users." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">Employee</th>
              <th class="px-4 py-3">Number</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Job title</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3 text-right">Salary</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (e of filtered(); track e._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{{ userName(e) }}</p>
                  <p class="text-xs text-slate-400">{{ userEmail(e) }}</p>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ e.employeeNumber }}</td>
                <td class="px-4 py-3 text-slate-600">{{ e.department }}</td>
                <td class="px-4 py-3 text-slate-600">{{ e.jobTitle }}</td>
                <td class="px-4 py-3 text-slate-600">{{ e.employmentType }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ e.basicSalary | kes }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="e.isActive ? 'ACTIVE' : 'INACTIVE'" /></td>
                <td class="px-4 py-3 text-right">
                  @if (auth.isSuperAdmin()) {
                    <button type="button" class="mr-3 text-xs font-medium text-indigo-600 hover:underline"
                      (click)="openEdit(e)">Edit</button>
                    <button type="button" class="mr-3 text-xs font-medium text-slate-500 hover:underline"
                      (click)="toggleStatus(e)">{{ e.isActive ? 'Deactivate' : 'Activate' }}</button>
                    <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
                      (click)="askDelete(e)">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="modalOpen.set(false)">
        <div class="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit employee' : 'New employee' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            @if (!editingId()) {
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">User</label>
                <select name="userId" required [(ngModel)]="form.userId"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="" disabled>Select user</option>
                  @for (u of users(); track u._id) {
                    <option [value]="u._id">{{ u.firstName }} {{ u.lastName }} ({{ u.email }})</option>
                  }
                </select>
              </div>
            }
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Department</label>
                <input name="department" required minlength="2" [(ngModel)]="form.department"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Job title</label>
                <input name="jobTitle" required minlength="2" [(ngModel)]="form.jobTitle"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Employment type</label>
                <select name="employmentType" required [(ngModel)]="form.employmentType"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Basic salary</label>
                <input name="basicSalary" type="number" min="0" required [(ngModel)]="form.basicSalary"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Hire date</label>
                <input name="hireDate" type="date" required [(ngModel)]="form.hireDate"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <input name="notes" maxlength="1000" [(ngModel)]="form.notes"
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

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete employee"
      [message]="'Delete employee record for ' + (deleteTarget() ? userName(deleteTarget()!) : '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class EmployeeListComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly items = signal<Employee[]>([]);
  readonly users = signal<User[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Employee | null>(null);
  readonly deleting = signal(false);

  readonly types: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CASUAL'];

  form: {
    userId: string; department: string; jobTitle: string;
    employmentType: EmploymentType; basicSalary: number; hireDate: string; notes: string;
  } = {
    userId: '', department: '', jobTitle: '', employmentType: 'FULL_TIME',
    basicSalary: 0, hireDate: '', notes: '',
  };

  ngOnInit(): void {
    this.reload();
    this.catalog.listUsers().subscribe({ next: (l) => this.users.set(l) });
  }

  reload(): void {
    this.loading.set(true);
    this.catalog.listEmployees().subscribe({
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

  userName(e: Employee): string {
    const u = e.userId;
    return u && typeof u === 'object' ? `${u.firstName} ${u.lastName}` : '—';
  }

  userEmail(e: Employee): string {
    const u = e.userId;
    return u && typeof u === 'object' ? u.email : '';
  }

  filtered(): Employee[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((e) =>
      [this.userName(e), this.userEmail(e), e.department, e.jobTitle, e.employeeNumber]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      userId: '', department: '', jobTitle: '', employmentType: 'FULL_TIME',
      basicSalary: 0, hireDate: new Date().toISOString().slice(0, 10), notes: '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(e: Employee): void {
    this.editingId.set(e._id);
    this.form = {
      userId: typeof e.userId === 'object' ? (e.userId as { _id?: string })._id ?? '' : '',
      department: e.department,
      jobTitle: e.jobTitle,
      employmentType: e.employmentType,
      basicSalary: e.basicSalary,
      hireDate: e.hireDate.slice(0, 10),
      notes: e.notes ?? '',
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set('');

    const payload = {
      userId: this.form.userId,
      department: this.form.department.trim(),
      jobTitle: this.form.jobTitle.trim(),
      employmentType: this.form.employmentType,
      basicSalary: Number(this.form.basicSalary),
      hireDate: this.form.hireDate,
      notes: this.form.notes.trim() || undefined,
    };

    const req$ = this.editingId()
      ? this.catalog.updateEmployee(this.editingId()!, {
          department: payload.department,
          jobTitle: payload.jobTitle,
          employmentType: payload.employmentType,
          basicSalary: payload.basicSalary,
          hireDate: payload.hireDate,
          notes: payload.notes,
        })
      : this.catalog.createEmployee(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Employee updated' : 'Employee created');
        this.modalOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  toggleStatus(e: Employee): void {
    this.catalog.setEmployeeStatus(e._id, !e.isActive).subscribe({
      next: () => {
        this.toast.success('Employee status updated');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  askDelete(e: Employee): void {
    this.deleteTarget.set(e);
  }

  doDelete(): void {
    const e = this.deleteTarget();
    if (!e) return;
    this.deleting.set(true);
    this.catalog.deleteEmployee(e._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Employee deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
