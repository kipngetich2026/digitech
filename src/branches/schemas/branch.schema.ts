import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({
  timestamps: true,
  collection: 'branches',
})
export class Branch {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 20,
  })
  code: string;

  @Prop({
    trim: true,
    maxlength: 255,
  })
  address?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  phone?: string;

  @Prop({
    trim: true,
    lowercase: true,
  })
  email?: string;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);