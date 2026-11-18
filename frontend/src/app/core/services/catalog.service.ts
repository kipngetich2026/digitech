import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '../models/branch.models';
import {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from '../models/customer.models';
import {
  CreateEmployeeRequest,
  CreateProductRequest,
  CreateServiceRequest,
  Employee,
  Product,
  Service,
  UpdateEmployeeRequest,
  UpdateProductRequest,
  UpdateServiceRequest,
} from '../models/catalog.models';
import { User, UpdateUserRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

  // Branches
  listBranches(): Observable<Branch[]> {
    return this.api.get<Branch[]>('/branches');
  }
  createBranch(req: CreateBranchRequest): Observable<Branch> {
    return this.api.post<Branch>('/branches', req);
  }
  updateBranch(id: string, req: UpdateBranchRequest): Observable<Branch> {
    return this.api.patch<Branch>(`/branches/${id}`, req);
  }
  setBranchStatus(id: string, isActive: boolean): Observable<Branch> {
    return this.api.patch<Branch>(`/branches/${id}/status`, { isActive });
  }
  deleteBranch(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/branches/${id}`);
  }

  // Customers
  listCustomers(): Observable<Customer[]> {
    return this.api.get<Customer[]>('/customers');
  }
  createCustomer(req: CreateCustomerRequest): Observable<Customer> {
    return this.api.post<Customer>('/customers', req);
  }
  updateCustomer(id: string, req: UpdateCustomerRequest): Observable<Customer> {
    return this.api.patch<Customer>(`/customers/${id}`, req);
  }
  setCustomerStatus(id: string, isActive: boolean): Observable<Customer> {
    return this.api.patch<Customer>(`/customers/${id}/status`, { isActive });
  }
  deleteCustomer(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/customers/${id}`);
  }

  // Products
  listProducts(): Observable<Product[]> {
    return this.api.get<Product[]>('/products');
  }
  createProduct(req: CreateProductRequest): Observable<Product> {
    return this.api.post<Product>('/products', req);
  }
  updateProduct(id: string, req: UpdateProductRequest): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}`, req);
  }
  setProductStatus(id: string, isActive: boolean): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}/status`, { isActive });
  }
  deleteProduct(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/products/${id}`);
  }

  // Services
  listServices(): Observable<Service[]> {
    return this.api.get<Service[]>('/services');
  }
  createService(req: CreateServiceRequest): Observable<Service> {
    return this.api.post<Service>('/services', req);
  }
  updateService(id: string, req: UpdateServiceRequest): Observable<Service> {
    return this.api.patch<Service>(`/services/${id}`, req);
  }
  setServiceStatus(id: string, isActive: boolean): Observable<Service> {
    return this.api.patch<Service>(`/services/${id}/status`, { isActive });
  }
  deleteService(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/services/${id}`);
  }

  // Employees
  listEmployees(): Observable<Employee[]> {
    return this.api.get<Employee[]>('/employees');
  }
  createEmployee(req: CreateEmployeeRequest): Observable<Employee> {
    return this.api.post<Employee>('/employees', req);
  }
  updateEmployee(id: string, req: UpdateEmployeeRequest): Observable<Employee> {
    return this.api.patch<Employee>(`/employees/${id}`, req);
  }
  setEmployeeStatus(id: string, isActive: boolean): Observable<Employee> {
    return this.api.patch<Employee>(`/employees/${id}/status`, { isActive });
  }
  deleteEmployee(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/employees/${id}`);
  }

  // Users
  listUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }
  updateUser(id: string, req: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, req);
  }
  deleteUser(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/users/${id}`);
  }
}
