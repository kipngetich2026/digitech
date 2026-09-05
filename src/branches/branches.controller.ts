import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(
      createBranchDto,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(
      id,
      updateBranchDto,
    );
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.branchesService.updateStatus(
      id,
      isActive,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}