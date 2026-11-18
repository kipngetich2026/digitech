import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @IsString()
  @IsIn([
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR',
  ])
  type: string;

  @IsString()
  @IsIn([
    'SYSTEM',
    'ORDER',
    'INVOICE',
    'PAYMENT',
    'EXPENSE',
    'INVENTORY',
    'EMPLOYEE',
    'CUSTOMER',
  ])
  category: string;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceType?: string;

  @IsOptional()
  @IsMongoId()
  referenceId?: string;
}