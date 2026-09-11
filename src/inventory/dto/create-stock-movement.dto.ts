import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStockMovementDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsIn([
    'STOCK_IN',
    'STOCK_OUT',
    'ADJUSTMENT',
    'RETURN',
  ])
  movementType: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}