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

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: any,
  ) {
    return this.productsService.create(
      createProductDto,
      req.user.branchId,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.productsService.findAll(req.user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.productsService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body()
    updateProductStatusDto: UpdateProductStatusDto,
    @Req() req: any,
  ) {
    return this.productsService.updateStatus(
      id,
      updateProductStatusDto.isActive,
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.productsService.remove(
      id,
      req.user,
    );
  }
}