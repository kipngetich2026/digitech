import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models/api.models';
import { Branch } from '../../core/models/branch.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-semibold text-slate-900">Create account</h1>
          <p class="mt-1 text-sm text-slate-500">Register as staff at your branch</p>
        </div>

        <form class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" (ngSubmit)="submit()" #f="ngForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="firstName">First name</label>
              <input id="firstName" name="firstName" required minlength="2" maxlength="50" [(ngModel)]="firstName"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="lastName">Last name</label>
              <input id="lastName" name="lastName" required minlength="2" maxlength="50" [(ngModel)]="lastName"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
          </div>

          <label class="mb-1 mt-3 block text-sm font-medium text-slate-700" for="remail">Email</label>
          <input id="remail" name="email" type="email" required email [(ngModel)]="email"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />

          <label class="mb-1 mt-3 block text-sm font-medium text-slate-700" for="phone">Phone</label>
          <input id="phone" name="phone" required minlength="10" maxlength="20" pattern="^[0-9+\-\\s()]+$" [(ngModel)]="phone"
            placeholder="+254 700 000000"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />

          <label class="mb-1 mt-3 block text-sm font-medium text-slate-700" for="rpassword">Password</label>
          <input id="rpassword" name="password" type="password" required minlength="8" maxlength="100" [(ngModel)]="password"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />

          <label class="mb-1 mt-3 block text-sm font-medium text-slate-700" for="branch">Branch</label>
          <select id="branch" name="branchId" required [(ngModel)]="branchId"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none">
            <option value="" disabled>Select branch</option>
            @for (b of branches(); track b._id) {
              <option [value]="b._id">{{ b.name }} ({{ b.code }})</option>
            }
          </select>
          @if (branchError()) {
            <p class="mt-2 text-xs text-amber-600">{{ branchError() }}</p>
          }

          @if (error()) {
            <p class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{{ error() }}</p>
          }

          <button type="submit"
            class="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="loading() || f.invalid">
            {{ loading() ? 'Creating…' : 'Create account' }}
          </button>

          <p class="mt-4 text-center text-sm text-slate-500">
            Already registered?
            <a routerLink="/login" class="font-medium text-indigo-600 hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  branchId = '';

  readonly loading = signal(false);
  readonly error = signal('');
  readonly branches = signal<Branch[]>([]);
  readonly branchError = signal('');

  ngOnInit(): void {
    // Branch list is SUPER_ADMIN-only on the backend; may fail for anonymous users.
    this.catalog.listBranches().subscribe({
      next: (list) => this.branches.set(list),
      error: () =>
        this.branchError.set(
          'Branch list unavailable. Ask an admin for a branch, or sign in instead.',
        ),
    });
  }

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    this.auth
      .register({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        phone: this.phone.trim(),
        password: this.password,
        branchId: this.branchId,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Account created. You can sign in now.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(errorMessage(err.error ?? err));
        },
      });
  }
}
