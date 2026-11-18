import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type InvoiceDocument =
  HydratedDocument<Invoice>;

@Schema({
  _id: true,
})
export class InvoiceItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
  })
  productId?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Service',
  })
  serviceId?: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  itemName: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  unitPrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;
}

export const InvoiceItemSchema =
  SchemaFactory.createForClass(InvoiceItem);

@Schema({
  timestamps: true,
  collection: 'invoices',
})
export class Invoice {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  invoiceNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
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
    type: [InvoiceItemSchema],
    required: true,
    validate: {
      validator: (items: InvoiceItem[]) =>
        items.length > 0,
      message:
        'An invoice must contain at least one item',
    },
  })
  items: InvoiceItem[];

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    default: 0,
    min: 0,
  })
  discount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  tax: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;

  @Prop({
    default: 0,
    min: 0,
  })
  amountPaid: number;

  @Prop({
    required: true,
    min: 0,
  })
  balanceDue: number;

  @Prop({
    default: 'UNPAID',
    uppercase: true,
  })
  paymentStatus: string;

  @Prop({
    default: 'ISSUED',
    uppercase: true,
  })
  status: string;

  @Prop()
  issueDate: Date;

  @Prop()
  dueDate?: Date;

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

export const InvoiceSchema =
  SchemaFactory.createForClass(Invoice);