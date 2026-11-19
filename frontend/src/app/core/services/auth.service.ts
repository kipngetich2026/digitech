import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { ELEVATED_ROLES, Role } from '../models/api.models';
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  SanitizedUser,
  TokenPair,
  UpdateUserRequest,
  User,
} from '../models/auth.models';
import { ApiService } from './api.service';

const STORAGE_KEY = 'digitech.auth';
const IDLE_STORAGE_KEY = 'digitech.auth.idle';

/** Kept in sync with IdleTimeoutService's storage key (avoids circular DI). */
function touchIdleClock(): void {
  try {
    localStorage.setItem(IDLE_STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function clearIdleClock(): void {
  try {
    localStorage.removeItem(IDLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface StoredAuth extends TokenPair {
  user: SanitizedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly stored = this.readStorage();
  private readonly _user = signal<SanitizedUser | null>(this.stored?.user ?? null);
  private readonly _token = signal<string | null>(this.stored?.accessToken ?? null);
  private readonly _refreshToken = signal<string | null>(this.stored?.refreshToken ?? null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPER_ADMIN');
  /** SUPER_ADMIN or MANAGER — everything except administration. */
  readonly isElevated = computed(() => this.hasRole(...ELEVATED_ROLES));
  readonly role = computed(() => this._user()?.role ?? null);
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  /** True when the signed-in user's role is included in `roles`. */
  hasRole(...roles: Role[]): boolean {
    const current = this._user()?.role;
    return !!current && roles.includes(current);
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('/auth/login', req)
      .pipe(tap((res) => this.persist(res, res.user, { resetIdle: true })));
  }

  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', req);
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this._refreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.api
      .post<RefreshResponse>('/auth/refresh', { refreshToken })
      .pipe(tap((res) => this.persist(res, res.user)));
  }

  loadMe(): Observable<MeResponse> {
    return this.api.get<MeResponse>('/auth/me').pipe(
      tap((res) => {
        const tokens = this.currentTokens();
        if (tokens) this.persist(tokens, res.user);
      }),
    );
  }

  updateProfile(id: string, req: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, req).pipe(
      tap((updated) => {
        const current = this._user();
        const tokens = this.currentTokens();

        if (
          current &&
          tokens &&
          updated &&
          (current._id === updated._id || current.id === updated.id)
        ) {
          this.persist(tokens, { ...current, ...updated });
        }
      }),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this._refreshToken();
    const body: LogoutRequest = refreshToken ? { refreshToken } : {};

    return this.api.post<void>('/auth/logout', body).pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    clearIdleClock();
    this._user.set(null);
    this._token.set(null);
    this._refreshToken.set(null);
    void this.router.navigate(['/login']);
  }

  private persist(
    tokens: TokenPair,
    user: SanitizedUser,
    opts: { resetIdle?: boolean } = {},
  ): void {
    const data: StoredAuth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (opts.resetIdle) touchIdleClock();
    this._token.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);
    this._user.set(user);
  }

  private currentTokens(): TokenPair | null {
    const accessToken = this._token();
    const refreshToken = this._refreshToken();

    if (!accessToken || !refreshToken) return null;

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
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
