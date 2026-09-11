import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type StockMovementDocument =
  HydratedDocument<StockMovement>;

@Schema({
  timestamps: true,
  collection: 'stock_movements',
})
export class StockMovement {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  movementNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'STOCK_IN',
      'STOCK_OUT',
      'ADJUSTMENT',
      'SALE',
      'RETURN',
    ],
  })
  movementType: string;

  @Prop({
    required: true,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  previousQuantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  newQuantity: number;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  reason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
  })
  orderId?: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  reference?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;
}

export const StockMovementSchema =
  SchemaFactory.createForClass(StockMovement);