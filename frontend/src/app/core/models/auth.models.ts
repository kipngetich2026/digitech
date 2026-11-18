import { BaseEntity, Role } from './api.models';

/** User as returned by auth endpoints (no password). */
export interface SanitizedUser extends BaseEntity {
  /** Auth endpoints include a camelCase `id` alongside `_id`. */
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  branchId: string;
  isActive: boolean;
  lastLogin?: string;
}

/** User as returned by /users endpoints (same shape, password never selected). */
export interface User extends SanitizedUser {}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  branchId: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: SanitizedUser;
}

export interface RegisterResponse {
  message: string;
  user: SanitizedUser;
}

export interface MeResponse {
  user: SanitizedUser;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/** What JwtStrategy puts on req.user (for reference / local state). */
export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  branchId: string;
}
