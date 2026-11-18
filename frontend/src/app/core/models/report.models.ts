import { ExpenseStatus } from './expense.models';
import { OrderStatus, PaymentStatus, PopulatedCustomerRef } from './order.models';
import { PaymentMethod, PaymentRecordStatus } from './payment.models';

export interface OverviewReport {
  customers: { total: number; active: number };
  products: { total: number; active: number; lowStock: number };
  services: { total: number; active: number };
  employees: { total: number; active: number };
  orders: { total: number; pending: number; completed: number; cancelled: number };
  invoices: {
    total: number;
    paid: number;
    unpaid: number;
    partial: number;
    outstandingAmount: number;
  };
  finance: { totalRevenue: number; totalExpenses: number; netIncome: number };
  payments: { total: number };
  inventory: { stockValue: number; lowStock: number };
}

export interface SalesReport {
  orderSummary: Array<{ _id: OrderStatus; count: number }>;
  revenue: { subtotal: number; discount: number; tax: number; total: number };
  monthlySales: Array<{
    _id: { year: number; month: number };
    orders: number;
    sales: number;
  }>;
}

export interface FinanceReport {
  payments: Array<{ _id: PaymentRecordStatus; count: number; amount: number }>;
  expenses: Array<{ _id: ExpenseStatus; count: number; amount: number }>;
  invoices: Array<{
    _id: PaymentStatus;
    count: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
  }>;
  totals: { revenue: number; expenses: number; netIncome: number };
}

export interface InventoryReport {
  summary: {
    totalProducts: number;
    activeProducts: number;
    lowStock: number;
    outOfStock: number;
    sellingValue: number;
    costValue: number;
  };
  products: Array<{
    sku: string;
    name: string;
    category: string;
    sellingPrice: number;
    costPrice: number;
    stockQuantity: number;
    reorderLevel: number;
  }>;
}

export interface RecentReport {
  orders: Array<{
    orderNumber: string;
    customerId: { _id: string; firstName: string; lastName: string; customerNumber: string };
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }>;
  payments: Array<{
    paymentNumber: string;
    invoiceId: { _id: string; invoiceNumber: string };
    amount: number;
    method: PaymentMethod;
    status: PaymentRecordStatus;
    createdAt: string;
  }>;
  expenses: Array<{
    expenseNumber: string;
    title: string;
    amount: number;
    status: ExpenseStatus;
    expenseDate: string;
    createdAt: string;
  }>;
  invoices: Array<{
    invoiceNumber: string;
    customerId: { _id: string; firstName: string; lastName: string; customerNumber: string };
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentStatus: PaymentStatus;
    issueDate: string;
  }>;
}

export type { PopulatedCustomerRef };
