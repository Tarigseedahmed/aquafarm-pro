import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  // Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø´Ø¹Ø§Ø± Ø¬Ø¯ÙŠØ¯
  async create(notificationData: Partial<Notification>, tenantId?: string): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...notificationData,
      tenantId,
    });
    return this.notificationsRepository.save(notification);
  }

  // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
  async findByUserId(userId: string, tenantId: string, limit = 50, page = 1) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = page < 1 ? 1 : page;
    const skip = (safePage - 1) * safeLimit;
    const [rows, total] = await this.notificationsRepository.findAndCount({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip,
    });
    // Return plain items+total so PaginationInterceptor provides { data, meta }
    return { items: rows, total };
  }

  // ØªØ­Ø¯ÙŠØ« Ø¥Ø´Ø¹Ø§Ø± ÙƒÙ…Ù‚Ø±ÙˆØ¡
  async markAsRead(id: string, userId: string, tenantId: string): Promise<Notification> {
    await this.notificationsRepository.update({ id, userId, tenantId }, { isRead: true });
    return this.notificationsRepository.findOne({ where: { id, userId, tenantId } });
  }

  // ØªØ­Ø¯ÙŠØ¯ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙƒÙ…Ù‚Ø±ÙˆØ¡Ø©
  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, tenantId, isRead: false },
      { isRead: true },
    );
  }

  // Ø­Ø°Ù Ø¥Ø´Ø¹Ø§Ø±
  async remove(id: string, userId: string, tenantId: string): Promise<void> {
    await this.notificationsRepository.delete({ id, userId, tenantId });
  }

  // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¹Ø¯Ø¯ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ø§Ù„Ù…Ù‚Ø±ÙˆØ¡Ø©
  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, tenantId, isRead: false },
    });
  }

  // Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ø­Ø¯Ø¯Ø© Ø­Ø³Ø¨ Ø§Ù„Ù†ÙˆØ¹
  async createWaterQualityAlert(
    userId: string,
    pondId: string,
    pondName: string,
    parameter: string,
    value: number,
    alertType: string,
    tenantId: string,
  ): Promise<Notification> {
    const titles = {
      high_temperature: 'ØªØ­Ø°ÙŠØ±: Ø¯Ø±Ø¬Ø© Ø­Ø±Ø§Ø±Ø© Ù…Ø±ØªÙØ¹Ø©',
      low_dissolved_oxygen: 'ØªØ­Ø°ÙŠØ±: Ù†Ù‚Øµ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ø§Ù„Ù…Ø°Ø§Ø¨',
      high_ammonia: 'ØªØ­Ø°ÙŠØ±: Ù…Ø³ØªÙˆÙ‰ Ø£Ù…ÙˆÙ†ÙŠØ§ Ù…Ø±ØªÙØ¹',
      ph_out_of_range:
        'ØªØ­Ø°ÙŠØ±: Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø­Ù…ÙˆØ¶Ø© Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ù‚Ø¨ÙˆÙ„',
    };

    const messages = {
      high_temperature: `Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© ÙÙŠ ${pondName} ÙˆØµÙ„Øª Ø¥Ù„Ù‰ ${value}Â°C`,
      low_dissolved_oxygen: `Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ø§Ù„Ù…Ø°Ø§Ø¨ ÙÙŠ ${pondName} Ø§Ù†Ø®ÙØ¶ Ø¥Ù„Ù‰ ${value} mg/L`,
      high_ammonia: `Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£Ù…ÙˆÙ†ÙŠØ§ ÙÙŠ ${pondName} Ø§Ø±ØªÙØ¹ Ø¥Ù„Ù‰ ${value} mg/L`,
      ph_out_of_range: `Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø­Ù…ÙˆØ¶Ø© ÙÙŠ ${pondName} ÙˆØµÙ„ Ø¥Ù„Ù‰ ${value}`,
    };

    return this.create(
      {
        userId,
        title: titles[alertType] || 'ØªÙ†Ø¨ÙŠÙ‡ Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡',
        message: messages[alertType] || `Ù‚ÙŠÙ…Ø© ${parameter} ÙÙŠ ${pondName}: ${value}`,
        type: 'warning',
        category: 'water_quality',
        priority: 'high',
        sourceType: 'pond',
        sourceId: pondId,
        data: {
          pondId,
          pondName,
          parameter,
          value,
          alertType,
        },
        actions: [
          {
            label: 'Ø¹Ø±Ø¶ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­ÙˆØ¶',
            action: 'view_pond',
            url: `/ponds/${pondId}`,
          },
          {
            label: 'Ø¹Ø±Ø¶ Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ù…ÙŠØ§Ù‡',
            action: 'view_water_quality',
            url: `/water-quality?pondId=${pondId}`,
          },
        ],
      },
      tenantId,
    );
  }

  // Ø¥Ø´Ø¹Ø§Ø± ØªØºØ°ÙŠØ© Ø§Ù„Ø£Ø³Ù…Ø§Ùƒ
  async createFeedingReminder(
    userId: string,
    fishBatchId: string,
    batchNumber: string,
    tenantId: string,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        title: 'ØªØ°ÙƒÙŠØ± Ø§Ù„ØªØºØ°ÙŠØ©',
        message: `Ø­Ø§Ù† ÙˆÙ‚Øª ØªØºØ°ÙŠØ© Ø§Ù„Ø¯ÙØ¹Ø© ${batchNumber}`,
        type: 'info',
        category: 'feeding',
        priority: 'medium',
        sourceType: 'fish_batch',
        sourceId: fishBatchId,
        data: {
          fishBatchId,
          batchNumber,
        },
        actions: [
          {
            label: 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØºØ°ÙŠØ©',
            action: 'record_feeding',
            url: `/feeding/record?batchId=${fishBatchId}`,
          },
        ],
      },
      tenantId,
    );
  }

  // Ø¥Ø´Ø¹Ø§Ø± ØµÙŠØ§Ù†Ø©
  async createMaintenanceAlert(
    userId: string,
    equipmentName: string,
    maintenanceType: string,
    tenantId: string,
  ): Promise<Notification> {
    return this.create(
      {
        userId,
        title: 'ØªÙ†Ø¨ÙŠÙ‡ ØµÙŠØ§Ù†Ø©',
        message: `${equipmentName} Ø¨Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ ${maintenanceType}`,
        type: 'warning',
        category: 'maintenance',
        priority: 'medium',
        data: {
          equipmentName,
          maintenanceType,
        },
      },
      tenantId,
    );
  }

  // Ø¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø±
  async createMockNotifications(userId?: string, tenantId?: string): Promise<any[]> {
    const mockNotifications = [
      {
        id: '1',
        title: 'ØªØ­Ø°ÙŠØ±: Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ù…Ù†Ø®ÙØ¶',
        message:
          'Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ø§Ù„Ù…Ø°Ø§Ø¨ ÙÙŠ Ø­ÙˆØ¶ Ø§Ù„Ù‡Ø§Ù…ÙˆØ± Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ø§Ù†Ø®ÙØ¶ Ø¥Ù„Ù‰ 4.2 mg/L',
        type: 'warning',
        category: 'water_quality',
        isRead: false,
        priority: 'high',
        sourceType: 'pond',
        sourceId: '1',
        userId: userId || null,
        tenantId: tenantId || null,
        createdAt: new Date(Date.now() - 1800000), // Ù…Ù†Ø° 30 Ø¯Ù‚ÙŠÙ‚Ø©
      },
      {
        id: '2',
        title: 'ØªØ°ÙƒÙŠØ± Ø§Ù„ØªØºØ°ÙŠØ©',
        message: 'Ø­Ø§Ù† ÙˆÙ‚Øª ØªØºØ°ÙŠØ© Ø¯ÙØ¹Ø© Ø§Ù„Ø¨Ù„Ø·ÙŠ Ø±Ù‚Ù… BT-2024-001',
        type: 'info',
        category: 'feeding',
        isRead: false,
        priority: 'medium',
        sourceType: 'fish_batch',
        sourceId: '1',
        userId: userId || null,
        tenantId: tenantId || null,
        createdAt: new Date(Date.now() - 3600000), // Ù…Ù†Ø° Ø³Ø§Ø¹Ø©
      },
      {
        id: '3',
        title: 'ØªÙ†Ø¨ÙŠÙ‡ ØµÙŠØ§Ù†Ø©',
        message:
          'Ù…Ø¶Ø®Ø© Ø§Ù„Ù‡ÙˆØ§Ø¡ ÙÙŠ Ø­ÙˆØ¶ Ø§Ù„Ø­Ø¶Ø§Ù†Ø© ØªØ­ØªØ§Ø¬ ØµÙŠØ§Ù†Ø© Ø¯ÙˆØ±ÙŠØ©',
        type: 'warning',
        category: 'maintenance',
        isRead: true,
        priority: 'medium',
        userId: userId || null,
        tenantId: tenantId || null,
        createdAt: new Date(Date.now() - 7200000), // Ù…Ù†Ø° Ø³Ø§Ø¹ØªÙŠÙ†
      },
      {
        id: '4',
        title: 'Ù†Ø¬Ø­ Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©',
        message:
          'ØªÙ… Ø­ÙØ¸ Ù‚Ø±Ø§Ø¡Ø© Ø¬ÙˆØ¯Ø© Ø§Ù„Ù…ÙŠØ§Ù‡ Ù„Ø­ÙˆØ¶ Ø§Ù„Ù‡Ø§Ù…ÙˆØ± Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ø¨Ù†Ø¬Ø§Ø­',
        type: 'success',
        category: 'system',
        isRead: true,
        priority: 'low',
        userId: userId || null,
        tenantId: tenantId || null,
        createdAt: new Date(Date.now() - 10800000), // Ù…Ù†Ø° 3 Ø³Ø§Ø¹Ø§Øª
      },
    ];

    return mockNotifications;
  }
}
