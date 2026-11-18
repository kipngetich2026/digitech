import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type AuditLogDocument =
  HydratedDocument<AuditLog>;

@Schema({
  timestamps: true,
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  userName: string;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'STATUS_CHANGE',
      'APPROVE',
      'REJECT',
      'PAYMENT',
      'STOCK_IN',
      'STOCK_OUT',
      'SALE',
      'RETURN',
    ],
    index: true,
  })
  action: string;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'AUTH',
      'USERS',
      'BRANCHES',
      'CUSTOMERS',
      'PRODUCTS',
      'SERVICES',
      'ORDERS',
      'INVOICES',
      'PAYMENTS',
      'EXPENSES',
      'EMPLOYEES',
      'INVENTORY',
      'NOTIFICATIONS',
    ],
    index: true,
  })
  module: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  description: string;

  @Prop({
    type: Types.ObjectId,
  })
  recordId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  ipAddress?: string;

  @Prop({
    type: Object,
  })
  metadata?: Record<string, any>;
}

export const AuditLogSchema =
  SchemaFactory.createForClass(AuditLog);