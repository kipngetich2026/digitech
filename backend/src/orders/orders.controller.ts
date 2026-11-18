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

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  create(
    @Body()
    createOrderDto: CreateOrderDto,

    @Req()
    req: any,
  ) {
    return this.ordersService.create(
      createOrderDto,
      req.user,
    );
  }

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findAll(
    @Req()
    req: any,
  ) {
    return this.ordersService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findOne(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    return this.ordersService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  update(
    @Param('id')
    id: string,

    @Body()
    updateOrderDto: UpdateOrderDto,

    @Req()
    req: any,
  ) {
    return this.ordersService.update(
      id,
      updateOrderDto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    updateOrderStatusDto: UpdateOrderStatusDto,

    @Req()
    req: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateOrderStatusDto.status,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(
    'SUPER_ADMIN',
  )
  remove(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    return this.ordersService.remove(
      id,
      req.user,
    );
  }
}