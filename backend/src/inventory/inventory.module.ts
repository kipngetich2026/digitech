import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  InventoryController
} from './inventory.controller';

import {
  InventoryService
} from './inventory.service';

import {
  StockMovement,
  StockMovementSchema,
} from './schemas/stock-movement.schema';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StockMovement.name,
        schema: StockMovementSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [
    InventoryController,
  ],

  providers: [
    InventoryService,
  ],

  exports: [
    InventoryService,
  ],
})
export class InventoryModule {}