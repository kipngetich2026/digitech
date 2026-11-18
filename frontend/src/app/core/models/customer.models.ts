import { BaseEntity } from './api.models';

export interface Customer extends BaseEntity {
  customerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId: string;
  isActive: boolean;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
