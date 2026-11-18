/** Shared API error shape returned by the backend. */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type Role = 'SUPER_ADMIN' | 'STAFF';

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
