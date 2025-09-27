import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { buildMeta, envelope } from '../common/pagination/pagination';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  // إنشاء إشعار جديد
  async create(notificationData: Partial<Notification>, tenantId?: string): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...notificationData,
      tenantId,
    });
    return this.notificationsRepository.save(notification);
  }

  // الحصول على إشعارات المستخدم
  async findByUserId(userId: string, tenantId: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [rows, total] = await this.notificationsRepository.findAndCount({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });
    return { ...envelope(rows, buildMeta(total, page, limit)), notifications: rows };
  }

  // تحديث إشعار كمقروء
  async markAsRead(id: string, userId: string, tenantId: string): Promise<Notification> {
    await this.notificationsRepository.update(
      { id, userId, tenantId },
      { isRead: true }
    );
    return this.notificationsRepository.findOne({ where: { id, userId, tenantId } });
  }

  // تحديد جميع الإشعارات كمقروءة
  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, tenantId, isRead: false },
      { isRead: true }
    );
  }

  // حذف إشعار
  async remove(id: string, userId: string, tenantId: string): Promise<void> {
    await this.notificationsRepository.delete({ id, userId, tenantId });
  }

  // الحصول على عدد الإشعارات غير المقروءة
  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, tenantId, isRead: false }
    });
  }

  // إشعارات محددة حسب النوع
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
      'high_temperature': 'تحذير: درجة حرارة مرتفعة',
      'low_dissolved_oxygen': 'تحذير: نقص الأكسجين المذاب',
      'high_ammonia': 'تحذير: مستوى أمونيا مرتفع',
      'ph_out_of_range': 'تحذير: مستوى الحموضة خارج النطاق المقبول'
    };

    const messages = {
      'high_temperature': `درجة الحرارة في ${pondName} وصلت إلى ${value}°C`,
      'low_dissolved_oxygen': `مستوى الأكسجين المذاب في ${pondName} انخفض إلى ${value} mg/L`,
      'high_ammonia': `مستوى الأمونيا في ${pondName} ارتفع إلى ${value} mg/L`,
      'ph_out_of_range': `مستوى الحموضة في ${pondName} وصل إلى ${value}`
    };

    return this.create({
      userId,
      title: titles[alertType] || 'تنبيه جودة المياه',
      message: messages[alertType] || `قيمة ${parameter} في ${pondName}: ${value}`,
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
        alertType
      },
      actions: [
        {
          label: 'عرض تفاصيل الحوض',
          action: 'view_pond',
          url: `/ponds/${pondId}`
        },
        {
          label: 'عرض قراءات المياه',
          action: 'view_water_quality',
          url: `/water-quality?pondId=${pondId}`
        }
      ]
    }, tenantId);
  }

  // إشعار تغذية الأسماك
  async createFeedingReminder(
    userId: string,
    fishBatchId: string,
    batchNumber: string,
    tenantId: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      title: 'تذكير التغذية',
      message: `حان وقت تغذية الدفعة ${batchNumber}`,
      type: 'info',
      category: 'feeding',
      priority: 'medium',
      sourceType: 'fish_batch',
      sourceId: fishBatchId,
      data: {
        fishBatchId,
        batchNumber
      },
      actions: [
        {
          label: 'تسجيل التغذية',
          action: 'record_feeding',
          url: `/feeding/record?batchId=${fishBatchId}`
        }
      ]
    }, tenantId);
  }

  // إشعار صيانة
  async createMaintenanceAlert(
    userId: string,
    equipmentName: string,
    maintenanceType: string,
    tenantId: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      title: 'تنبيه صيانة',
      message: `${equipmentName} بحاجة إلى ${maintenanceType}`,
      type: 'warning',
      category: 'maintenance',
      priority: 'medium',
      data: {
        equipmentName,
        maintenanceType
      }
    }, tenantId);
  }

  // بيانات تجريبية للاختبار
  async createMockNotifications(userId: string): Promise<any[]> {
    const mockNotifications = [
      {
        id: '1',
        title: 'تحذير: مستوى الأكسجين منخفض',
        message: 'مستوى الأكسجين المذاب في حوض الهامور الرئيسي انخفض إلى 4.2 mg/L',
        type: 'warning',
        category: 'water_quality',
        isRead: false,
        priority: 'high',
        sourceType: 'pond',
        sourceId: '1',
        createdAt: new Date(Date.now() - 1800000) // منذ 30 دقيقة
      },
      {
        id: '2',
        title: 'تذكير التغذية',
        message: 'حان وقت تغذية دفعة البلطي رقم BT-2024-001',
        type: 'info',
        category: 'feeding',
        isRead: false,
        priority: 'medium',
        sourceType: 'fish_batch',
        sourceId: '1',
        createdAt: new Date(Date.now() - 3600000) // منذ ساعة
      },
      {
        id: '3',
        title: 'تنبيه صيانة',
        message: 'مضخة الهواء في حوض الحضانة تحتاج صيانة دورية',
        type: 'warning',
        category: 'maintenance',
        isRead: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 7200000) // منذ ساعتين
      },
      {
        id: '4',
        title: 'نجح حفظ القراءة',
        message: 'تم حفظ قراءة جودة المياه لحوض الهامور الرئيسي بنجاح',
        type: 'success',
        category: 'system',
        isRead: true,
        priority: 'low',
        createdAt: new Date(Date.now() - 10800000) // منذ 3 ساعات
      }
    ];

    return mockNotifications;
  }
}