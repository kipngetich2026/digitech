import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [NotificationsController],

  providers: [NotificationsService],

  exports: [NotificationsService],
})
export class NotificationsModule {}