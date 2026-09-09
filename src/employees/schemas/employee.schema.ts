import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type EmployeeDocument =
  HydratedDocument<Employee>;

@Schema({
  timestamps: true,
  collection: 'employees',
})
export class Employee {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  employeeNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  department: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  jobTitle: string;

  @Prop({
    required: true,
    uppercase: true,
    enum: [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'INTERN',
      'CASUAL',
    ],
  })
  employmentType: string;

  @Prop({
    required: true,
    min: 0,
  })
  basicSalary: number;

  @Prop({
    required: true,
  })
  hireDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  emergencyContactName?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  emergencyContactPhone?: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  notes?: string;
}

export const EmployeeSchema =
  SchemaFactory.createForClass(Employee);