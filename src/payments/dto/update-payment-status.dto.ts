import {
  IsIn,
  IsString,
} from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsIn([
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REVERSED',
  ])
  status: string;
}