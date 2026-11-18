import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  timestamps: true,
  collection: 'customers',
})
export class Customer {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  customerNumber: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  firstName: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  lastName: string;

  @Prop({
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  email?: string;

  @Prop({
    required: true,
    unique: true,
    sparse: true,
    trim: true,
  })
  phone?: string;

  @Prop({
    trim: true,
    maxlength: 255,
  })
  address?: string;

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

export const CustomerSchema =
  SchemaFactory.createForClass(Customer);