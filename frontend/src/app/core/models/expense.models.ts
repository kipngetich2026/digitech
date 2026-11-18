import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';
import { PaymentMethod } from './payment.models';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface Expense extends BaseEntity {
  expenseNumber: string;
  title: string;
  category: string;
  description?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  expenseDate: string;
  branchId: string;
  status: ExpenseStatus;
  notes?: string;
  createdBy: string | PopulatedUserRef;
  approvedBy?: string | PopulatedUserRef;
  approvedAt?: string;
}

export interface CreateExpenseRequest {
  title: string;
  category: string;
  description?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  expenseDate: string;
  notes?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;
