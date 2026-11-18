export type AppRole = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';

/** SUPER_ADMIN + MANAGER: elevated ops (delete, cross-branch, all notifications, …). */
export function isElevated(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

/** SUPER_ADMIN only: administration (users, branches). */
export function isAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export const ELEVATED_ROLES: AppRole[] = ['SUPER_ADMIN', 'MANAGER'];
export const ALL_ROLES: AppRole[] = ['SUPER_ADMIN', 'MANAGER', 'STAFF'];
export const ADMIN_ROLES: AppRole[] = ['SUPER_ADMIN'];
