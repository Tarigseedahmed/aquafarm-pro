import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
  Body,
  Post,
  Res,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { Response } from 'express';

export class BatchMarkReadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'uuid' } })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List notifications for current user (paginated)' })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 50 } })
  @ApiQuery({ name: 'page', required: false, schema: { default: 1 } })
  @ApiOkResponse({
    description: 'Paginated notifications envelope',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
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
  @Post('mark-batch-read')
  @ApiOperation({ summary: 'Mark a batch of notifications as read' })
  @ApiBody({ type: BatchMarkReadDto })
  markBatchRead(@Body() body: BatchMarkReadDto, @Request() req) {
    return this.notificationsService.markBatchAsRead(body.ids, req.user.id, req.tenantId);
  }

  // Simple Server-Sent Events stream for real-time notifications
  // Clients connect with EventSource('/api/notifications/stream') including auth token header (fetch polyfill or custom since native EventSource can't set headers).
  // For now, we allow token via query param 'token' fallback (documenting security tradeoff for MVP).
  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async stream(@Request() req, @Res() res: Response) {
    // Protected by JwtAuthGuard: req.user + req.tenantId expected.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const listener = (notif: any) => {
      if (notif.tenantId !== req.tenantId || notif.userId !== req.user?.id) return;
      res.write(`event: notification\n`);
      res.write(`data: ${JSON.stringify(notif)}\n\n`);
    };
    this.notificationsService.onNewNotification(listener);

    // Send a comment ping every 25s to keep connection alive
    const ping = setInterval(() => {
      res.write(`: ping ${Date.now()}\n\n`);
    }, 25000);

    req.on('close', () => {
      clearInterval(ping);
      this.notificationsService.offNewNotification(listener);
      res.end();
    });
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
