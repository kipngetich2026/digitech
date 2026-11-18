import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ReceiptService } from './receipt.service';

import { Payment, PaymentSchema } from './schemas/payment.schema';

import { Invoice, InvoiceSchema } from '../invoices/schemas/invoice.schema';

import { Branch, BranchSchema } from '../branches/schemas/branch.schema';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: Branch.name,
        schema: BranchSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    AuditLogsModule,
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService, ReceiptService],

  exports: [PaymentsService, ReceiptService],
})
export class PaymentsModule {}
