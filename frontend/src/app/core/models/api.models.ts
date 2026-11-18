/** Shared API error shape returned by the backend. */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';

/** SUPER_ADMIN + MANAGER: elevated ops (delete, cross-branch, …). */
export const ELEVATED_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER'];

/** SUPER_ADMIN only: administration (users, branches). */
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN'];

/** Every authenticated role. */
export const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'STAFF'];

export interface ObjectIdString {
  $oid?: string;
}

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export function errorMessage(err: unknown): string {
  const e = err as ApiError;
  if (Array.isArray(e?.message)) return e.message.join(', ');
  if (typeof e?.message === 'string' && e.message) return e.message;
  return 'Something went wrong';
}
