import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';
import { PopulatedCustomerRef } from './order.models';
import { PaymentStatus } from './order.models';

export type PaymentMethod = 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
export type PaymentRecordStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface Payment extends BaseEntity {
  paymentNumber: string;
  invoiceId: string | PopulatedInvoiceRef;
  orderId: string;
  customerId: string | PopulatedCustomerRef;
  branchId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: PaymentRecordStatus;
  notes?: string;
  createdBy: string | PopulatedUserRef;
}

export interface PopulatedInvoiceRef {
  _id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}
