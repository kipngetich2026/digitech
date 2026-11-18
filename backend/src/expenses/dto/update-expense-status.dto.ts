import {
  IsIn,
  IsString,
} from 'class-validator';

export class UpdateExpenseStatusDto {
  @IsString()
  @IsIn([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID',
  ])
  status: string;
}