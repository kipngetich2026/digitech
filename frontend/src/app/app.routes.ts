import { Routes } from '@angular/router';
import { authGuard, guestGuard, superAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./layout/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./layout/register/register.component').then((m) => m.RegisterComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard · Digitech', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'profile', title: 'Profile · Digitech', loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent) },

      { path: 'customers', title: 'Customers · Digitech', loadComponent: () => import('./features/customers/customer-list.component').then((m) => m.CustomerListComponent) },

      { path: 'products', title: 'Products · Digitech', loadComponent: () => import('./features/products/product-list.component').then((m) => m.ProductListComponent) },
      { path: 'products/:id', title: 'Product · Digitech', loadComponent: () => import('./features/products/product-detail.component').then((m) => m.ProductDetailComponent) },

      { path: 'services', title: 'Services · Digitech', loadComponent: () => import('./features/services/service-list.component').then((m) => m.ServiceListComponent) },

      { path: 'orders', title: 'Orders · Digitech', loadComponent: () => import('./features/orders/order-list.component').then((m) => m.OrderListComponent) },
      { path: 'orders/new', title: 'New order · Digitech', loadComponent: () => import('./features/orders/order-create.component').then((m) => m.OrderCreateComponent) },
      { path: 'orders/:id', title: 'Order · Digitech', loadComponent: () => import('./features/orders/order-detail.component').then((m) => m.OrderDetailComponent) },

      { path: 'invoices', title: 'Invoices · Digitech', loadComponent: () => import('./features/invoices/invoice-list.component').then((m) => m.InvoiceListComponent) },
      { path: 'invoices/:id', title: 'Invoice · Digitech', loadComponent: () => import('./features/invoices/invoice-detail.component').then((m) => m.InvoiceDetailComponent) },

      { path: 'payments', title: 'Payments · Digitech', loadComponent: () => import('./features/payments/payment-list.component').then((m) => m.PaymentListComponent) },
      { path: 'expenses', title: 'Expenses · Digitech', loadComponent: () => import('./features/expenses/expense-list.component').then((m) => m.ExpenseListComponent) },
      { path: 'inventory', title: 'Inventory · Digitech', loadComponent: () => import('./features/inventory/inventory.component').then((m) => m.InventoryComponent) },
      { path: 'employees', title: 'Employees · Digitech', loadComponent: () => import('./features/employees/employee-list.component').then((m) => m.EmployeeListComponent) },

      { path: 'users', canActivate: [superAdminGuard], title: 'Users · Digitech', loadComponent: () => import('./features/users/user-list.component').then((m) => m.UserListComponent) },
      { path: 'branches', canActivate: [superAdminGuard], title: 'Branches · Digitech', loadComponent: () => import('./features/branches/branch-list.component').then((m) => m.BranchListComponent) },
      { path: 'audit-logs', canActivate: [superAdminGuard], title: 'Audit logs · Digitech', loadComponent: () => import('./features/audit-logs/audit-log-list.component').then((m) => m.AuditLogListComponent) },
      { path: 'notifications', title: 'Notifications · Digitech', loadComponent: () => import('./features/notifications/notification-list.component').then((m) => m.NotificationListComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
