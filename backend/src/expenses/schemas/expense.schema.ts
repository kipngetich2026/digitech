import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type ExpenseDocument =
  HydratedDocument<Expense>;

@Schema({
  timestamps: true,
  collection: 'expenses',
})
export class Expense {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  expenseNumber: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  category: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  description?: string;

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
  paymentMethod: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  reference?: string;

  @Prop({
    required: true,
  })
  expenseDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    default: 'PENDING',
    uppercase: true,
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'PAID',
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

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const ExpenseSchema =
  SchemaFactory.createForClass(Expense);