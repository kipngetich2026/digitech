import {
  IsIn,
  IsString,
} from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsString()
  @IsIn([
    'ISSUED',
    'CANCELLED',
  ])
  status: string;
}