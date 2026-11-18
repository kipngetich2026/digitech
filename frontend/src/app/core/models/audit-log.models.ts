import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STATUS_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'PAYMENT'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'SALE'
  | 'RETURN';

export type AuditModule =
  | 'AUTH'
  | 'USERS'
  | 'BRANCHES'
  | 'CUSTOMERS'
  | 'PRODUCTS'
  | 'SERVICES'
  | 'ORDERS'
  | 'INVOICES'
  | 'PAYMENTS'
  | 'EXPENSES'
  | 'EMPLOYEES'
  | 'INVENTORY'
  | 'NOTIFICATIONS';

export interface AuditLog extends BaseEntity {
  userId: string | PopulatedUserRef;
  userName: string;
  action: AuditAction | string;
  module: AuditModule | string;
  description: string;
  recordId?: string;
  branchId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}
