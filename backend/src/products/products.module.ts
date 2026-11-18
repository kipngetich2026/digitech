import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

import {
  Product,
  ProductSchema,
} from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [ProductsController],

  providers: [ProductsService],

  exports: [ProductsService],
})
export class ProductsModule {}