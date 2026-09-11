import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsIn([
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'STATUS_CHANGE',
    'APPROVE',
    'REJECT',
    'PAYMENT',
    'STOCK_IN',
    'STOCK_OUT',
    'SALE',
    'RETURN',
  ])
  action: string;

  @IsString()
  @IsIn([
    'AUTH',
    'USERS',
    'BRANCHES',
    'CUSTOMERS',
    'PRODUCTS',
    'SERVICES',
    'ORDERS',
    'INVOICES',
    'PAYMENTS',
    'EXPENSES',
    'EMPLOYEES',
    'INVENTORY',
    'NOTIFICATIONS',
  ])
  module: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsMongoId()
  recordId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ipAddress?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}