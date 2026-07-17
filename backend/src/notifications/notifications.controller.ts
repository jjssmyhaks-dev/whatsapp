import {
  Controller, Get, Post, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { User as UserEntity } from '../common/database/entities/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'read', required: false })
  async list(
    @User() user: UserEntity,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('read') read?: string,
  ) {
    return this.service.getNotifications(
      user.id,
      limit || 20,
      offset || 0,
      read !== undefined ? read === 'true' : undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count' })
  async unreadCount(@User() user: UserEntity) {
    return { count: await this.service.getUnreadCount(user.id) };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@User() user: UserEntity, @Param('id') id: string) {
    return this.service.markAsRead(id, user.id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all as read' })
  async markAllAsRead(@User() user: UserEntity) {
    return { count: await this.service.markAllAsRead(user.id) };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test notification' })
  async test(@User() user: UserEntity) {
    return { success: await this.service.sendTestNotification(user.id) };
  }
}
