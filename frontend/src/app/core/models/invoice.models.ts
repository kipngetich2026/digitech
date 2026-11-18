import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';
import { OrderStatus, PaymentStatus, PopulatedCustomerRef } from './order.models';

export type InvoiceStatus = 'ISSUED' | 'CANCELLED';

export interface InvoiceItem {
  _id: string;
  productId?: string;
  serviceId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  orderId: string | PopulatedOrderRef;
  customerId: string | PopulatedCustomerRef;
  branchId: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  createdBy: string | PopulatedUserRef;
}

export interface PopulatedOrderRef {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
}

export interface CreateInvoiceRequest {
  orderId: string;
  amountPaid?: number;
  dueDate?: string;
  notes?: string;
}

export interface UpdateInvoiceRequest {
  dueDate?: string;
  notes?: string;
}
