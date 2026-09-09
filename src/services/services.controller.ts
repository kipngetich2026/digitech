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

import { ServicesService } from './services.service';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createServiceDto: CreateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.create(
      createServiceDto,
      req.user.branchId,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.servicesService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.servicesService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.update(
      id,
      updateServiceDto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body()
    updateServiceStatusDto: UpdateServiceStatusDto,
    @Req() req: any,
  ) {
    return this.servicesService.updateStatus(
      id,
      updateServiceStatusDto.isActive,
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.servicesService.remove(
      id,
      req.user,
    );
  }
}