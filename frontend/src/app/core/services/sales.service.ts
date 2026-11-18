import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreateOrderRequest, Order, UpdateOrderRequest } from '../models/order.models';
import { CreateInvoiceRequest, Invoice, UpdateInvoiceRequest } from '../models/invoice.models';
import { CreatePaymentRequest, Payment } from '../models/payment.models';
import { CreateExpenseRequest, Expense, UpdateExpenseRequest } from '../models/expense.models';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  // Orders
  listOrders(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders');
  }
  getOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }
  createOrder(req: CreateOrderRequest): Observable<Order> {
    return this.api.post<Order>('/orders', req);
  }
  updateOrder(id: string, req: UpdateOrderRequest): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}`, req);
  }
  setOrderStatus(id: string, status: string): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/status`, { status });
  }
  deleteOrder(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/orders/${id}`);
  }

  // Invoices
  listInvoices(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('/invoices');
  }
  getInvoice(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`/invoices/${id}`);
  }
  createInvoice(req: CreateInvoiceRequest): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices', req);
  }
  updateInvoice(id: string, req: UpdateInvoiceRequest): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}`, req);
  }
  setInvoiceStatus(id: string, status: string): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}/status`, { status });
  }
  deleteInvoice(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/invoices/${id}`);
  }

  // Payments
  listPayments(): Observable<Payment[]> {
    return this.api.get<Payment[]>('/payments');
  }
  createPayment(req: CreatePaymentRequest): Observable<Payment> {
    return this.api.post<Payment>('/payments', req);
  }
  setPaymentStatus(id: string, status: string): Observable<Payment> {
    return this.api.patch<Payment>(`/payments/${id}/status`, { status });
  }
  deletePayment(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/payments/${id}`);
  }

  /** Download auto-generated payment receipt PDF (with headers for filename). */
  downloadReceipt(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/payments/${id}/receipt`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  // Expenses
  listExpenses(): Observable<Expense[]> {
    return this.api.get<Expense[]>('/expenses');
  }
  createExpense(req: CreateExpenseRequest): Observable<Expense> {
    return this.api.post<Expense>('/expenses', req);
  }
  updateExpense(id: string, req: UpdateExpenseRequest): Observable<Expense> {
    return this.api.patch<Expense>(`/expenses/${id}`, req);
  }
  setExpenseStatus(id: string, status: string): Observable<Expense> {
    return this.api.patch<Expense>(`/expenses/${id}/status`, { status });
  }
  deleteExpense(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/expenses/${id}`);
  }
}
