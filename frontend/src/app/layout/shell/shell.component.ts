import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/reports.service';
import { ToastHostComponent } from '../../shared/components/toast-host.component';

interface NavItem {
  label: string;
  link: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHostComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  sidebarOpen = false;
  userMenuOpen = false;
  unreadCount = 0;

  readonly groups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', link: '/dashboard', icon: '▦' }],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Orders', link: '/orders', icon: '🛒' },
        { label: 'Invoices', link: '/invoices', icon: '🧾' },
        { label: 'Payments', link: '/payments', icon: '💳' },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { label: 'Customers', link: '/customers', icon: '👥' },
        { label: 'Products', link: '/products', icon: '📦' },
        { label: 'Services', link: '/services', icon: '🛠' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Inventory', link: '/inventory', icon: '📊' },
        { label: 'Expenses', link: '/expenses', icon: '💸' },
        { label: 'Employees', link: '/employees', icon: '🧑‍💼' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Users', link: '/users', icon: '👤', adminOnly: true },
        { label: 'Branches', link: '/branches', icon: '🏢', adminOnly: true },
        { label: 'Audit logs', link: '/audit-logs', icon: '📜', adminOnly: true },
        { label: 'Notifications', link: '/notifications', icon: '🔔' },
      ],
    },
  ];

  constructor() {
    this.refreshCount();
    setInterval(() => this.refreshCount(), 60_000);
  }

  visibleGroups(): Array<{ title: string; items: NavItem[] }> {
    const admin = this.auth.isSuperAdmin();
    return this.groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.adminOnly || admin),
      }))
      .filter((g) => g.items.length > 0);
  }

  refreshCount(): void {
    if (!this.auth.isAuthenticated()) return;
    this.notifications.unreadCount().subscribe({
      next: (r) => (this.unreadCount = r.count),
      error: () => (this.unreadCount = 0),
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.userMenuOpen = false;
    this.auth.logout().subscribe({ error: () => undefined });
  }
}
