import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CustomersService } from './customers.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerStatusDto } from './dto/update-customer-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Req() req: any,
  ) {
    return this.customersService.create(
      createCustomerDto,
      req.user.branchId,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.customersService.findAll(req.user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.customersService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Req() req: any,
  ) {
    return this.customersService.update(
      id,
      updateCustomerDto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body() updateCustomerStatusDto: UpdateCustomerStatusDto,
    @Req() req: any,
  ) {
    return this.customersService.updateStatus(
      id,
      updateCustomerStatusDto.isActive,
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.customersService.remove(
      id,
      req.user,
    );
  }
}