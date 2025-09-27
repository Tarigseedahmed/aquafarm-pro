import { Controller, Get, Patch, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req, @Query('limit') limit?: string, @Query('page') page?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.notificationsService.findByUserId(req.user.id, req.tenantId, limitNum, pageNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id, req.tenantId);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mark-all-read')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id, req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id, req.tenantId);
  }

  // Endpoint ØªØ¬Ø±ÙŠØ¨ÙŠ Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø±
  @Get('test/mock')
  async getMockNotifications(
    @Query('userId') userId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const testUserId = userId || '550e8400-e29b-41d4-a716-446655440000';
    const notifications = await this.notificationsService.createMockNotifications(
      testUserId,
      tenantId,
    );

    return {
      message: 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©',
      data: notifications,
      summary: {
        total: notifications.length,
        unread: notifications.filter((n) => !n.isRead).length,
        categories: {
          water_quality: notifications.filter((n) => n.category === 'water_quality').length,
          feeding: notifications.filter((n) => n.category === 'feeding').length,
          maintenance: notifications.filter((n) => n.category === 'maintenance').length,
          system: notifications.filter((n) => n.category === 'system').length,
        },
        priorities: {
          high: notifications.filter((n) => n.priority === 'high').length,
          medium: notifications.filter((n) => n.priority === 'medium').length,
          low: notifications.filter((n) => n.priority === 'low').length,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
