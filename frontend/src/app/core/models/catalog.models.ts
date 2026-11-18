import { BaseEntity, Role } from './api.models';

export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  branchId: string;
  isActive: boolean;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface Service extends BaseEntity {
  serviceCode: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  branchId: string;
  isActive: boolean;
}

export interface CreateServiceRequest {
  serviceCode: string;
  name: string;
  description?: string;
  category: string;
  price: number;
}

export type UpdateServiceRequest = Partial<CreateServiceRequest>;

export interface Employee extends BaseEntity {
  employeeNumber: string;
  userId: PopulatedUserRef;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  basicSalary: number;
  hireDate: string;
  branchId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  notes?: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CASUAL';

export interface CreateEmployeeRequest {
  userId: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  basicSalary: number;
  hireDate: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;

export interface PopulatedUserRef {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
}
