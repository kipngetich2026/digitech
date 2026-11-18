import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { PaymentsService } from './payments.service';
import { ReceiptService } from './receipt.service';

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
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    return this.paymentsService.create(createPaymentDto, req.user);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  findAll(@Req() req: any) {
    return this.paymentsService.findAll(req.user);
  }

  @Get(':id/receipt')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  @Header('Cache-Control', 'no-store')
  async downloadReceipt(
    @Param('id') id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.receiptService.generateForPayment(
      id,
      req.user,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.findById(id, req.user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF')
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
  @Roles('SUPER_ADMIN', 'MANAGER')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.remove(id, req.user);
  }
}
