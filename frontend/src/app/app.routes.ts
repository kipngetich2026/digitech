import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { ADMIN_ROLES, ALL_ROLES } from './core/models/api.models';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layout/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layout/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profile',
        title: 'Profile · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },

      {
        path: 'customers',
        title: 'Customers · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/customers/customer-list.component').then((m) => m.CustomerListComponent),
      },

      {
        path: 'products',
        title: 'Products · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/products/product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'products/:id',
        title: 'Product · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/products/product-detail.component').then((m) => m.ProductDetailComponent),
      },

      {
        path: 'services',
        title: 'Services · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/services/service-list.component').then((m) => m.ServiceListComponent),
      },

      {
        path: 'orders',
        title: 'Orders · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/orders/order-list.component').then((m) => m.OrderListComponent),
      },
      {
        path: 'orders/new',
        title: 'New order · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/orders/order-create.component').then((m) => m.OrderCreateComponent),
      },
      {
        path: 'orders/:id',
        title: 'Order · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/orders/order-detail.component').then((m) => m.OrderDetailComponent),
      },

      {
        path: 'invoices',
        title: 'Invoices · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/invoices/invoice-list.component').then((m) => m.InvoiceListComponent),
      },
      {
        path: 'invoices/:id',
        title: 'Invoice · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/invoices/invoice-detail.component').then((m) => m.InvoiceDetailComponent),
      },

      {
        path: 'payments',
        title: 'Payments · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/payments/payment-list.component').then((m) => m.PaymentListComponent),
      },
      {
        path: 'expenses',
        title: 'Expenses · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/expenses/expense-list.component').then((m) => m.ExpenseListComponent),
      },
      {
        path: 'inventory',
        title: 'Inventory · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
      {
        path: 'employees',
        title: 'Employees · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/employees/employee-list.component').then((m) => m.EmployeeListComponent),
      },

      {
        path: 'users',
        title: 'Users · Digitech',
        data: { roles: ADMIN_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/users/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'branches',
        title: 'Branches · Digitech',
        data: { roles: ADMIN_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branches/branch-list.component').then((m) => m.BranchListComponent),
      },
      {
        path: 'audit-logs',
        title: 'Audit logs · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/audit-logs/audit-log-list.component').then((m) => m.AuditLogListComponent),
      },
      {
        path: 'notifications',
        title: 'Notifications · Digitech',
        data: { roles: ALL_ROLES },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/notifications/notification-list.component').then((m) => m.NotificationListComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
