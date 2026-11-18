import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  SanitizedUser,
  UpdateUserRequest,
  User,
} from '../models/auth.models';
import { ApiService } from './api.service';

const STORAGE_KEY = 'digitech.auth';

interface StoredAuth {
  accessToken: string;
  user: SanitizedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<SanitizedUser | null>(this.readStorage()?.user ?? null);
  private readonly _token = signal<string | null>(this.readStorage()?.accessToken ?? null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPER_ADMIN');
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', req).pipe(
      tap((res) => this.persist(res.accessToken, res.user)),
    );
  }

  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', req);
  }

  loadMe(): Observable<MeResponse> {
    return this.api.get<MeResponse>('/auth/me').pipe(
      tap((res) => {
        const token = this._token();
        if (token) this.persist(token, res.user);
      }),
    );
  }

  updateProfile(id: string, req: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, req).pipe(
      map((updated) => {
        const current = this._user();
        if (current && updated && (current._id === updated._id || current.id === updated.id)) {
          this.persist(this._token()!, { ...current, ...updated });
        }
        return updated;
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._user.set(null);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  private persist(token: string, user: SanitizedUser): void {
    const data: StoredAuth = { accessToken: token, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this._token.set(token);
    this._user.set(user);
  }

  private readStorage(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }
}
