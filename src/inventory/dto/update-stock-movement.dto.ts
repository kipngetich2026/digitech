import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateStockMovementDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}