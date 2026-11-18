import { BaseEntity } from './api.models';

export interface Branch extends BaseEntity {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface CreateBranchRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

export type UpdateBranchRequest = Partial<CreateBranchRequest>;
