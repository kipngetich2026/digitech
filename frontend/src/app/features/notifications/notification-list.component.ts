import { Component, OnInit, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/reports.service';
import { ToastService } from '../../core/services/toast.service';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { errorMessage } from '../../core/models/api.models';
import { Notification } from '../../core/models/notification.models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, StatusBadgeComponent, DatePipe],
  template: `
    <app-page-header title="Notifications" subtitle="Your alerts and system messages">
      <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        (click)="markAll()">Mark all read</button>
    </app-page-header>

    <div class="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
      <button type="button" class="rounded-md px-4 py-1.5 font-medium"
        [class.bg-white]="tab() === 'all'" [class.shadow-sm]="tab() === 'all'"
        [class.text-slate-900]="tab() === 'all'" [class.text-slate-500]="tab() !== 'all'"
        (click)="tab.set('all')">All</button>
      <button type="button" class="rounded-md px-4 py-1.5 font-medium"
        [class.bg-white]="tab() === 'unread'" [class.shadow-sm]="tab() === 'unread'"
        [class.text-slate-900]="tab() === 'unread'" [class.text-slate-500]="tab() !== 'unread'"
        (click)="tab.set('unread')">Unread</button>
    </div>

    @if (loading()) {
      <app-loading />
    } @else {
      <div class="space-y-2">
        @for (n of visible(); track n._id) {
          <div class="flex items-start justify-between gap-4 rounded-xl bg-white p-4 ring-1"
            [class.ring-indigo-200]="!n.isRead"
            [class.ring-slate-200]="n.isRead">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <app-status-badge [status]="n.type" />
                <span class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ n.category }}</span>
                @if (!n.isRead) {
                  <span class="h-2 w-2 rounded-full bg-indigo-500" aria-label="Unread"></span>
                }
              </div>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ n.title }}</p>
              <p class="mt-0.5 text-sm text-slate-600">{{ n.message }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ n.createdAt | appDate:true }}</p>
            </div>
            <div class="flex shrink-0 gap-3 text-xs font-medium">
              @if (!n.isRead) {
                <button type="button" class="text-indigo-600 hover:underline" (click)="markRead(n)">Mark read</button>
              }
              <button type="button" class="text-rose-600 hover:underline" (click)="remove(n)">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-400">
            No {{ tab() === 'unread' ? 'unread ' : '' }}notifications
          </div>
        }
      </div>
    }
  `,
})
export class NotificationListComponent implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly items = signal<Notification[]>([]);
  readonly tab = signal<'all' | 'unread'>('all');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.notifications.list().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err.error ?? err));
      },
    });
  }

  visible(): Notification[] {
    return this.tab() === 'unread' ? this.items().filter((n) => !n.isRead) : this.items();
  }

  markRead(n: Notification): void {
    this.notifications.markRead(n._id).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((x) => (x._id === n._id ? updated : x)));
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  markAll(): void {
    this.notifications.markAllRead().subscribe({
      next: () => {
        this.toast.success('All marked as read');
        this.reload();
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }

  remove(n: Notification): void {
    this.notifications.remove(n._id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((x) => x._id !== n._id));
        this.toast.success('Notification deleted');
      },
      error: (err) => this.toast.error(errorMessage(err.error ?? err)),
    });
  }
}
