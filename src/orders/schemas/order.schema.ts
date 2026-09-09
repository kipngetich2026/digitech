import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type OrderDocument =
  HydratedDocument<Order>;

@Schema({
  _id: true,
})
export class OrderItem {
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

export const OrderItemSchema =
  SchemaFactory.createForClass(OrderItem);

@Schema({
  timestamps: true,
  collection: 'orders',
})
export class Order {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  orderNumber: string;

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
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) =>
        items.length > 0,
      message:
        'An order must contain at least one item',
    },
  })
  items: OrderItem[];

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
    default: 'PENDING',
    uppercase: true,
  })
  status: string;

  @Prop({
    default: 'UNPAID',
    uppercase: true,
  })
  paymentStatus: string;

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

export const OrderSchema =
  SchemaFactory.createForClass(Order);