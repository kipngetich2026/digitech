import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models/api.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">D</span>
          <img src="/logo.png" alt="" width="48" height="48" aria-hidden="true"
            class="mx-auto h-12 w-12 rounded-xl object-cover"
            onerror="this.remove()" onload="this.previousElementSibling?.remove()" />
          <h1 class="mt-4 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p class="mt-1 text-sm text-slate-500">Digitech Hub collection &amp; sales console</p>
        </div>

        <form
          class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          (ngSubmit)="submit()"
          #f="ngForm"
        >
          <label class="mb-1 block text-sm font-medium text-slate-700" for="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            email
            [(ngModel)]="email"
            class="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ring-1 ring-transparent focus:border-slate-400 focus:outline-none focus:ring-slate-200"
            placeholder="you@company.com"
            autocomplete="email"
          />

          <label class="mb-1 block text-sm font-medium text-slate-700" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="8"
            [(ngModel)]="password"
            class="mb-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ring-1 ring-transparent focus:border-slate-400 focus:outline-none focus:ring-slate-200"
            placeholder="••••••••"
            autocomplete="current-password"
          />
          <p class="mb-4 text-xs text-slate-400">Minimum 8 characters</p>

          @if (error()) {
            <p class="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="loading() || f.invalid"
          >
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>

          <p class="mt-4 text-center text-sm text-slate-500">
            Need an account?
            <a routerLink="/register" class="font-medium text-indigo-600 hover:underline">Register</a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Welcome back, ${res.user.firstName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err.error ?? err));
      },
    });
  }
}
