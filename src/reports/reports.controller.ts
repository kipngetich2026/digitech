import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'STAFF')
  getOverview(@Req() req: any) {
    return this.reportsService.getOverview(
      req.user,
    );
  }

  @Get('sales')
  @Roles('SUPER_ADMIN', 'STAFF')
  getSalesReport(@Req() req: any) {
    return this.reportsService.getSalesReport(
      req.user,
    );
  }

  @Get('finance')
  @Roles('SUPER_ADMIN', 'STAFF')
  getFinanceReport(@Req() req: any) {
    return this.reportsService.getFinanceReport(
      req.user,
    );
  }

  @Get('inventory')
  @Roles('SUPER_ADMIN', 'STAFF')
  getInventoryReport(@Req() req: any) {
    return this.reportsService.getInventoryReport(
      req.user,
    );
  }

  @Get('recent')
  @Roles('SUPER_ADMIN', 'STAFF')
  getRecentActivity(@Req() req: any) {
    return this.reportsService.getRecentActivity(
      req.user,
    );
  }
}