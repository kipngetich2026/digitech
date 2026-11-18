import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  OrdersController,
} from './orders.controller';

import {
  OrdersService,
} from './orders.service';

import {
  Order,
  OrderSchema,
} from './schemas/order.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

import {
  Service,
  ServiceSchema,
} from '../services/schemas/service.schema';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema';

import {
  InventoryModule,
} from '../inventory/inventory.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
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
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    InventoryModule,
    AuditLogsModule,
  ],

  controllers: [
    OrdersController,
  ],

  providers: [
    OrdersService,
  ],

  exports: [
    OrdersService,
  ],
})
export class OrdersModule {}