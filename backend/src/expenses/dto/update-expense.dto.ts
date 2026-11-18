import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'CASH',
    'MPESA',
    'BANK_TRANSFER',
    'CARD',
    'CHEQUE',
  ])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}