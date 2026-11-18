import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { errorMessage } from '../../core/models/api.models';
import { User } from '../../core/models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DatePipe],
  template: `
    <app-page-header title="Profile" subtitle="Your account details" />

    <div class="max-w-xl rounded-xl bg-white p-6 ring-1 ring-slate-200">
      @if (user(); as u) {
        <dl class="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-slate-400">Role</dt>
            <dd class="font-medium text-slate-800">{{ u.role }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Status</dt>
            <dd class="font-medium text-slate-800">{{ u.isActive ? 'Active' : 'Inactive' }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Member since</dt>
            <dd class="font-medium text-slate-800">{{ u.createdAt | appDate }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Last login</dt>
            <dd class="font-medium text-slate-800">{{ u.lastLogin || '—' }}</dd>
          </div>
        </dl>

        <form (ngSubmit)="save()" #f="ngForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="pfn">First name</label>
              <input id="pfn" name="firstName" required minlength="2" [(ngModel)]="form.firstName"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="pln">Last name</label>
              <input id="pln" name="lastName" required minlength="2" [(ngModel)]="form.lastName"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="pem">Email</label>
            <input id="pem" name="email" type="email" required email [(ngModel)]="form.email"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700" for="pph">Phone</label>
            <input id="pph" name="phone" [(ngModel)]="form.phone"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
          </div>

          @if (error()) {
            <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ error() }}</p>
          }

          <button type="submit"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="saving() || f.invalid">
            {{ saving() ? 'Saving…' : 'Save changes' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.user;
  readonly saving = signal(false);
  readonly error = signal('');
  form: { firstName: string; lastName: string; email: string; phone: string } = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.form = {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone ?? '',
      };
    }
  }

  save(): void {
    const u = this.user();
    if (!u) return;
    this.saving.set(true);
    this.error.set('');

    const id = u._id;
    this.catalog.updateUser(id, { ...this.form, phone: this.form.phone || undefined }).subscribe({
      next: (updated: User) => {
        this.saving.set(false);
        this.toast.success('Profile updated');
        // refresh local auth user
        this.auth.loadMe().subscribe({ error: () => undefined });
        void updated;
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err.error ?? err));
      },
    });
  }
}
