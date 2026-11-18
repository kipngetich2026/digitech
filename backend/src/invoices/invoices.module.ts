import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

import {
  Invoice,
  InvoiceSchema,
} from './schemas/invoice.schema';

import {
  Order,
  OrderSchema,
} from '../orders/schemas/order.schema';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [InvoicesController],

  providers: [InvoicesService],

  exports: [InvoicesService],
})
export class InvoicesModule {}