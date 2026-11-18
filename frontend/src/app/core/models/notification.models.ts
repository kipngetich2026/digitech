import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationCategory =
  | 'SYSTEM'
  | 'ORDER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'EXPENSE'
  | 'INVENTORY'
  | 'EMPLOYEE'
  | 'CUSTOMER';

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  userId: string | PopulatedUserRef;
  branchId: string;
  isRead: boolean;
  createdBy?: string | PopulatedUserRef;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  userId: string;
  referenceType?: string;
  referenceId?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ReadAllResponse {
  message: string;
  modifiedCount: number;
}
