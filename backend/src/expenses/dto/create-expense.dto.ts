import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn([
    'CASH',
    'MPESA',
    'BANK_TRANSFER',
    'CARD',
    'CHEQUE',
  ])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}