import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  Service,
  ServiceSchema,
} from '../services/schemas/service.schema';

import {
  Order,
  OrderSchema,
} from '../orders/schemas/order.schema';

import {
  Invoice,
  InvoiceSchema,
} from '../invoices/schemas/invoice.schema';

import {
  Payment,
  PaymentSchema,
} from '../payments/schemas/payment.schema';

import {
  Expense,
  ExpenseSchema,
} from '../expenses/schemas/expense.schema';

import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Service.name,
        schema: ServiceSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Expense.name,
        schema: ExpenseSchema,
      },
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [ReportsController],

  providers: [ReportsService],

  exports: [ReportsService],
})
export class ReportsModule {}