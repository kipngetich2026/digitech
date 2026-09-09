import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

import {
  Service,
  ServiceSchema,
} from './schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Service.name,
        schema: ServiceSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [ServicesController],

  providers: [ServicesService],

  exports: [ServicesService],
})
export class ServicesModule {}