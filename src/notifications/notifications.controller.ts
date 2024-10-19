import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req) {
    return this.notificationsService.findAllForUser(req.user.userId);
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(+id, req.user.userId);
  }
  @Post('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
  @Get('recent')
  async getRecentNotifications(@Request() req) {
    return this.notificationsService.recentNotification(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }
}
