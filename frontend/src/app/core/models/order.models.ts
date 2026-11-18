import { BaseEntity } from './api.models';
import { Customer } from './customer.models';
import { PopulatedUserRef } from './catalog.models';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface OrderItem {
  _id: string;
  productId?: string;
  serviceId?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string | PopulatedCustomerRef;
  branchId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdBy: string | PopulatedUserRef;
}

export interface PopulatedCustomerRef {
  _id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface CreateOrderItemRequest {
  productId?: string;
  serviceId?: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: CreateOrderItemRequest[];
  discount?: number;
  tax?: number;
  notes?: string;
}

export interface UpdateOrderRequest {
  discount?: number;
  tax?: number;
  notes?: string;
}
