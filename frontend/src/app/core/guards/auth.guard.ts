import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/api.models';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};

/**
 * Role-based route guard. Declare allowed roles on the route:
 * ```ts
 * { path: 'users', canActivate: [roleGuard], data: { roles: ['SUPER_ADMIN'] }, ... }
 * ```
 * Unauthenticated users go to /login; wrong role goes to /dashboard.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const roles = route.data['roles'] as readonly Role[] | undefined;
  if (!roles || roles.length === 0) {
    return true;
  }

  return auth.hasRole(...roles) ? true : router.createUrlTree(['/dashboard']);
};

/** Back-compat alias — equivalent to `roleGuard` with `data: { roles: ['SUPER_ADMIN'] }`. */
export const superAdminGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return auth.isSuperAdmin() ? true : router.createUrlTree(['/dashboard']);
};
