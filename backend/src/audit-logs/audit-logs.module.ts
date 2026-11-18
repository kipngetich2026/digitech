import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import {
  AuditLogsController,
} from './audit-logs.controller';

import {
  AuditLogsService,
} from './audit-logs.service';

import {
  AuditLog,
  AuditLogSchema,
} from './schemas/audit-log.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditLog.name,
        schema: AuditLogSchema,
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

  controllers: [
    AuditLogsController,
  ],

  providers: [
    AuditLogsService,
  ],

  exports: [
    AuditLogsService,
  ],
})
export class AuditLogsModule {}