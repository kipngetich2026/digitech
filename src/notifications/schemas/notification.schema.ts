import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type NotificationDocument =
  HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    required: true,
    trim: true,
    maxlength: 150,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  message: string;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'INFO',
      'SUCCESS',
      'WARNING',
      'ERROR',
    ],
    default: 'INFO',
  })
  type: string;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'SYSTEM',
      'ORDER',
      'INVOICE',
      'PAYMENT',
      'EXPENSE',
      'INVENTORY',
      'EMPLOYEE',
      'CUSTOMER',
    ],
  })
  category: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    default: false,
    index: true,
  })
  isRead: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy?: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  referenceType?: string;

  @Prop({
    type: Types.ObjectId,
  })
  referenceId?: Types.ObjectId;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);