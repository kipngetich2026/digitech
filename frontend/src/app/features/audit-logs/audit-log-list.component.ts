import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../core/services/reports.service';
import { ToastService } from '../../core/services/toast.service';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { errorMessage } from '../../core/models/api.models';
import { AuditLog } from '../../core/models/audit-log.models';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [
    FormsModule, PageHeaderComponent, SearchInputComponent, EmptyStateComponent,
    LoadingComponent, DatePipe, LabelPipe,
  ],
  template: `
    <app-page-header title="Audit logs" subtitle="Read-only trail of system activity" />

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search description, user, action…" />
      <select class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        [ngModel]="moduleFilter()" (ngModelChange)="moduleFilter.set($event)" ngModel>
        <option value="">All modules</option>
        @for (m of modules; track m) {
          <option [value]="m">{{ m }}</option>
        }
      </select>
      <span class="text-xs text-slate-400">{{ filtered().length }} entries</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No audit logs" hint="Activity will appear here as users perform actions." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">When</th>
              <th class="px-4 py-3">User</th>
              <th class="px-4 py-3">Action</th>
              <th class="px-4 py-3">Module</th>
              <th class="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (log of filtered(); track log._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ log.createdAt | appDate:true }}</td>
                <td class="px-4 py-3 font-medium text-slate-800">
                  {{ userName(log) }}
                  <p class="text-xs font-normal text-slate-400">{{ userEmail(log) }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {{ log.action | label }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ log.module | label }}</td>
                <td class="px-4 py-3 text-slate-600">{{ log.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AuditLogListComponent implements OnInit {
  private readonly audit = inject(AuditLogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<AuditLog[]>([]);
  readonly query = signal('');
  readonly moduleFilter = signal('');

  readonly modules = [
    'AUTH', 'USERS', 'BRANCHES', 'CUSTOMERS', 'PRODUCTS', 'SERVICES', 'ORDERS',
    'INVOICES', 'PAYMENTS', 'EXPENSES', 'EMPLOYEES', 'INVENTORY', 'NOTIFICATIONS',
  ];

  ngOnInit(): void {
    this.audit.list().subscribe({
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

  userName(log: AuditLog): string {
    const u = log.userId;
    return u && typeof u === 'object'
      ? `${u.firstName} ${u.lastName}`
      : log.userName || '—';
  }

  userEmail(log: AuditLog): string {
    const u = log.userId;
    return u && typeof u === 'object' ? u.email : '';
  }

  filtered(): AuditLog[] {
    const q = this.query().toLowerCase().trim();
    const mod = this.moduleFilter();
    return this.items().filter((log) => {
      if (mod && log.module !== mod) return false;
      if (!q) return true;
      return [log.description, log.action, log.module, this.userName(log), this.userEmail(log)]
        .some((v) => v.toLowerCase().includes(q));
    });
  }
}
