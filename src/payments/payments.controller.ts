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

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.create(
      createPaymentDto,
      req.user,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.paymentsService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.paymentsService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body()
    updatePaymentStatusDto: UpdatePaymentStatusDto,
    @Req() req: any,
  ) {
    return this.paymentsService.updateStatus(
      id,
      updatePaymentStatusDto.status,
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.paymentsService.remove(
      id,
      req.user,
    );
  }
}