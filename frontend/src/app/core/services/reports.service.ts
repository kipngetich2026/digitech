import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Notification,
  ReadAllResponse,
  UnreadCountResponse,
} from '../models/notification.models';
import { AuditLog } from '../models/audit-log.models';
import {
  FinanceReport,
  InventoryReport,
  OverviewReport,
  RecentReport,
  SalesReport,
} from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);

  overview(): Observable<OverviewReport> {
    return this.api.get<OverviewReport>('/reports/overview');
  }
  sales(): Observable<SalesReport> {
    return this.api.get<SalesReport>('/reports/sales');
  }
  finance(): Observable<FinanceReport> {
    return this.api.get<FinanceReport>('/reports/finance');
  }
  inventory(): Observable<InventoryReport> {
    return this.api.get<InventoryReport>('/reports/inventory');
  }
  recent(): Observable<RecentReport> {
    return this.api.get<RecentReport>('/reports/recent');
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  list(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications');
  }
  unread(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications/unread');
  }
  unreadCount(): Observable<UnreadCountResponse> {
    return this.api.get<UnreadCountResponse>('/notifications/unread/count');
  }
  all(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications/all');
  }
  markRead(id: string): Observable<Notification> {
    return this.api.patch<Notification>(`/notifications/${id}/read`, {});
  }
  markAllRead(): Observable<ReadAllResponse> {
    return this.api.patch<ReadAllResponse>('/notifications/read-all', {});
  }
  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/notifications/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);

  list(): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>('/audit-logs');
  }
  byAction(action: string): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>(`/audit-logs/action/${action}`);
  }
  byModule(module: string): Observable<AuditLog[]> {
    return this.api.get<AuditLog[]>(`/audit-logs/module/${module}`);
  }
}
