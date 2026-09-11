import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AuditLogsService,
} from './audit-logs.service';

import {
  CreateAuditLogDto,
} from './dto/create-audit-log.dto';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  create(
    @Body()
    createAuditLogDto: CreateAuditLogDto,

    @Req()
    req: any,
  ) {
    return this.auditLogsService.create(
      createAuditLogDto,
      req.user,
    );
  }

  // =========================================================
  // ALL LOGS
  // =========================================================

  @Get()
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findAll(
    @Req()
    req: any,
  ) {
    return this.auditLogsService.findAll(
      req.user,
    );
  }

  // =========================================================
  // BY ACTION
  // =========================================================

  @Get('action/:action')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findByAction(
    @Param('action')
    action: string,

    @Req()
    req: any,
  ) {
    return this.auditLogsService.findByAction(
      action,
      req.user,
    );
  }

  // =========================================================
  // BY MODULE
  // =========================================================

  @Get('module/:module')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findByModule(
    @Param('module')
    module: string,

    @Req()
    req: any,
  ) {
    return this.auditLogsService.findByModule(
      module,
      req.user,
    );
  }

  // =========================================================
  // BY USER
  // =========================================================

  @Get('user/:userId')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findByUser(
    @Param('userId')
    userId: string,

    @Req()
    req: any,
  ) {
    return this.auditLogsService.findByUser(
      userId,
      req.user,
    );
  }

  // =========================================================
  // BY RECORD
  // =========================================================

  @Get('record/:recordId')
  @Roles(
    'SUPER_ADMIN',
    'STAFF',
  )
  findByRecord(
    @Param('recordId')
    recordId: string,

    @Req()
    req: any,
  ) {
    return this.auditLogsService.findByRecord(
      recordId,
      req.user,
    );
  }

  // =========================================================
  // ONE LOG
  // =========================================================

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
    return this.auditLogsService.findById(
      id,
      req.user,
    );
  }
}