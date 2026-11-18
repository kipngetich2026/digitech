import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type PaymentDocument =
  HydratedDocument<Payment>;

@Schema({
  timestamps: true,
  collection: 'payments',
})
export class Payment {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  paymentNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true,
  })
  invoiceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  orderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    required: true,
    min: 0.01,
  })
  amount: number;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'CASH',
      'MPESA',
      'BANK_TRANSFER',
      'CARD',
      'CHEQUE',
    ],
  })
  method: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  reference?: string;

  @Prop({
    default: 'COMPLETED',
    uppercase: true,
    enum: [
      'PENDING',
      'COMPLETED',
      'FAILED',
      'REVERSED',
    ],
  })
  status: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  notes?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;
}

export const PaymentSchema =
  SchemaFactory.createForClass(Payment);