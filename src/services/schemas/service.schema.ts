import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({
  timestamps: true,
  collection: 'services',
})
export class Service {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  serviceCode: string;

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
  price: number;

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

export const ServiceSchema =
  SchemaFactory.createForClass(Service);