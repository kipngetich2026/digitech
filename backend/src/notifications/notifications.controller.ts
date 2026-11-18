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

import { NotificationsService } from './notifications.service';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'STAFF')
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: any,
  ) {
    return this.notificationsService.create(
      createNotificationDto,
      req.user,
    );
  }

  @Get()
  @Roles('SUPER_ADMIN', 'STAFF')
  findAll(@Req() req: any) {
    return this.notificationsService.findMyNotifications(
      req.user,
    );
  }

  @Get('unread')
  @Roles('SUPER_ADMIN', 'STAFF')
  findUnread(@Req() req: any) {
    return this.notificationsService.findUnread(
      req.user,
    );
  }

  @Get('unread/count')
  @Roles('SUPER_ADMIN', 'STAFF')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(
      req.user,
    );
  }

  @Get('all')
  @Roles('SUPER_ADMIN')
  findAllNotifications(@Req() req: any) {
    return this.notificationsService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.findById(
      id,
      req.user,
    );
  }

  @Patch(':id/read')
  @Roles('SUPER_ADMIN', 'STAFF')
  markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user,
    );
  }

  @Patch('read-all')
  @Roles('SUPER_ADMIN', 'STAFF')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(
      req.user,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'STAFF')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.remove(
      id,
      req.user,
    );
  }
}