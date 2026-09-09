import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

import {
  Employee,
  EmployeeSchema,
} from './schemas/employee.schema';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Employee.name,
        schema: EmployeeSchema,
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

  controllers: [EmployeesController],

  providers: [EmployeesService],

  exports: [EmployeesService],
})
export class EmployeesModule {}