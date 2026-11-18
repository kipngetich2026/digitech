import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('inventory')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  // ---------------------------------------------------------
  // CREATE STOCK MOVEMENT
  // ---------------------------------------------------------

  @Post('movement')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  createMovement(
    @Body()
    createStockMovementDto: CreateStockMovementDto,

    @Req() req: any,
  ) {
    return this.inventoryService.createMovement(
      createStockMovementDto,
      req.user,
    );
  }

  // ---------------------------------------------------------
  // INVENTORY SUMMARY
  // ---------------------------------------------------------

  @Get('summary')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  getSummary(
    @Req() req: any,
  ) {
    return this.inventoryService.getInventorySummary(
      req.user,
    );
  }

  // ---------------------------------------------------------
  // CURRENT STOCK
  // ---------------------------------------------------------

  @Get('stock')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  getCurrentStock(
    @Req() req: any,
  ) {
    return this.inventoryService.getCurrentStock(
      req.user,
    );
  }

  // ---------------------------------------------------------
  // LOW STOCK
  // ---------------------------------------------------------

  @Get('low-stock')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  getLowStock(
    @Req() req: any,
  ) {
    return this.inventoryService.getLowStock(
      req.user,
    );
  }

  // ---------------------------------------------------------
  // OUT OF STOCK
  // ---------------------------------------------------------

  @Get('out-of-stock')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  getOutOfStock(
    @Req() req: any,
  ) {
    return this.inventoryService.getOutOfStock(
      req.user,
    );
  }

  // ---------------------------------------------------------
  // ALL MOVEMENTS
  // ---------------------------------------------------------

  @Get('movements')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findAllMovements(
    @Req() req: any,
  ) {
    return this.inventoryService.findAllMovements(
      req.user,
    );
  }

  // ---------------------------------------------------------
  // PRODUCT MOVEMENTS
  // ---------------------------------------------------------

  @Get('product/:productId/movements')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findProductMovements(
    @Param('productId')
    productId: string,

    @Req() req: any,
  ) {
    return this.inventoryService.findProductMovements(
      productId,
      req.user,
    );
  }

  // ---------------------------------------------------------
  // ONE MOVEMENT
  // ---------------------------------------------------------

  @Get('movement/:id')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findMovement(
    @Param('id') id: string,

    @Req() req: any,
  ) {
    return this.inventoryService.findMovementById(
      id,
      req.user,
    );
  }
}