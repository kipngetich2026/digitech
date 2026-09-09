import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  collection: 'products',
})
export class Product {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  sku: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  category: string;

  @Prop({
    required: true,
    min: 0,
  })
  sellingPrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  costPrice: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  stockQuantity: number;

  @Prop({
    required: true,
    default: 5,
    min: 0,
  })
  reorderLevel: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const ProductSchema =
  SchemaFactory.createForClass(Product);