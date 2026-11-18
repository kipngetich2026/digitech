import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../core/services/sales.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { KesPipe } from '../../shared/pipes/kes.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Expense, ExpenseStatus } from '../../core/models/expense.models';
import { PaymentMethod } from '../../core/models/payment.models';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    FormsModule, PageHeaderComponent, SearchInputComponent, StatusBadgeComponent,
    EmptyStateComponent, LoadingComponent, ConfirmDialogComponent, KesPipe, DatePipe,
  ],
  template: `
    <app-page-header title="Expenses" subtitle="Track and approve business expenses">
      <button type="button" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        (click)="openCreate()">+ New expense</button>
    </app-page-header>

    <div class="mb-4 flex items-center justify-between gap-3">
      <app-search-input [value]="query()" (search)="query.set($event)" placeholder="Search expenses…" />
      <span class="text-xs text-slate-400">{{ filtered().length }} expenses</span>
    </div>

    @if (loading()) {
      <app-loading />
    } @else if (filtered().length === 0) {
      <app-empty-state title="No expenses found" hint="Record an expense to start tracking spend." />
    } @else {
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
        <table class="min-w-full divide-y divide-slate-100 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Expense</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Method</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (e of filtered(); track e._id) {
              <tr class="hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-800">{{ e.title }}</p>
                  <p class="text-xs text-slate-400">{{ e.expenseNumber }}</p>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ e.category }}</td>
                <td class="px-4 py-3 text-slate-500">{{ e.expenseDate | appDate }}</td>
                <td class="px-4 py-3 text-slate-600">{{ e.paymentMethod }}</td>
                <td class="px-4 py-3 text-right font-medium text-slate-800">{{ e.amount | kes }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="e.status" /></td>
                <td class="px-4 py-3 text-right">
                  @if (canAct(e.status)) {
                    @for (s of nextStatuses(e.status); track s) {
                      <button type="button"
                        class="mr-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                        (click)="setStatus(e, s)">{{ s }}</button>
                    }
                  }
                  <button type="button" class="mr-2 text-xs font-medium text-indigo-600 hover:underline"
                    (click)="openEdit(e)">Edit</button>
                  <button type="button" class="text-xs font-medium text-rose-600 hover:underline"
                    (click)="askDelete(e)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (modalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" (click)="modalOpen.set(false)">
        <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold text-slate-900">{{ editingId() ? 'Edit expense' : 'New expense' }}</h2>
          <form class="mt-4 space-y-3" (ngSubmit)="save()" #f="ngForm">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Title</label>
              <input name="title" required minlength="2" maxlength="100" [(ngModel)]="form.title"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <input name="category" required maxlength="100" [(ngModel)]="form.category"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <input name="amount" type="number" min="0.01" step="0.01" required [(ngModel)]="form.amount"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
                <select name="paymentMethod" required [(ngModel)]="form.paymentMethod"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  @for (m of methods; track m) { <option [value]="m">{{ m }}</option> }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Expense date</label>
                <input name="expenseDate" type="date" required [(ngModel)]="form.expenseDate"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea name="description" rows="2" maxlength="1000" [(ngModel)]="form.description"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"></textarea>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Reference</label>
              <input name="reference" maxlength="100" [(ngModel)]="form.reference"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
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

    <app-confirm-dialog [open]="deleteTarget() !== null" title="Delete expense"
      [message]="'Delete ' + (deleteTarget()?.title || '') + '?'"
      [busy]="deleting()" (confirm)="doDelete()" (cancel)="deleteTarget.set(null)" />
  `,
})
export class ExpenseListComponent implements OnInit {
  private readonly sales = inject(SalesService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Expense[]>([]);
  readonly query = signal('');
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deleteTarget = signal<Expense | null>(null);
  readonly deleting = signal(false);

  readonly methods: PaymentMethod[] = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CARD', 'CHEQUE'];

  form: {
    title: string; category: string; description: string; amount: number;
    paymentMethod: PaymentMethod; reference: string; expenseDate: string;
  } = { title: '', category: '', description: '', amount: 0, paymentMethod: 'CASH', reference: '', expenseDate: '' };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.sales.listExpenses().subscribe({
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

  filtered(): Expense[] {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((e) =>
      [e.title, e.category, e.expenseNumber].some((v) => v.toLowerCase().includes(q)),
    );
  }

  canAct(status: ExpenseStatus): boolean {
    return status === 'PENDING' || status === 'APPROVED';
  }

  nextStatuses(status: ExpenseStatus): ExpenseStatus[] {
    if (status === 'PENDING') return ['APPROVED', 'REJECTED'];
    if (status === 'APPROVED') return ['PAID'];
    return [];
  }

  setStatus(e: Expense, status: ExpenseStatus): void {
    this.sales.setExpenseStatus(e._id, status).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x._id === e._id ? updated : x)));
        this.toast.success(`Expense marked ${status}`);
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      title: '', category: '', description: '', amount: 0,
      paymentMethod: 'CASH', reference: '',
      expenseDate: new Date().toISOString().slice(0, 10),
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  openEdit(e: Expense): void {
    this.editingId.set(e._id);
    this.form = {
      title: e.title, category: e.category, description: e.description ?? '',
      amount: e.amount, paymentMethod: e.paymentMethod, reference: e.reference ?? '',
      expenseDate: e.expenseDate.slice(0, 10),
    };
    this.formError.set('');
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set('');

    const payload = {
      title: this.form.title.trim(),
      category: this.form.category.trim(),
      description: this.form.description.trim() || undefined,
      amount: Number(this.form.amount),
      paymentMethod: this.form.paymentMethod,
      reference: this.form.reference.trim() || undefined,
      expenseDate: this.form.expenseDate,
    };

    const req$ = this.editingId()
      ? this.sales.updateExpense(this.editingId()!, payload)
      : this.sales.createExpense(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editingId() ? 'Expense updated' : 'Expense created');
        this.modalOpen.set(false);
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err.error ?? err));
      },
    });
  }

  askDelete(e: Expense): void {
    this.deleteTarget.set(e);
  }

  doDelete(): void {
    const e = this.deleteTarget();
    if (!e) return;
    this.deleting.set(true);
    this.sales.deleteExpense(e._id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Expense deleted');
        this.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }
}
