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

import { ExpensesService } from './expenses.service';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Req() req: any,
  ) {
    return this.expensesService.create(
      createExpenseDto,
      req.user,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.expensesService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.expensesService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ) {
    return this.expensesService.update(
      id,
      updateExpenseDto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'STAFF')
  updateStatus(
    @Param('id') id: string,
    @Body()
    updateExpenseStatusDto: UpdateExpenseStatusDto,
    @Req() req: any,
  ) {
    return this.expensesService.updateStatus(
      id,
      updateExpenseStatusDto.status,
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.expensesService.remove(
      id,
      req.user,
    );
  }
}