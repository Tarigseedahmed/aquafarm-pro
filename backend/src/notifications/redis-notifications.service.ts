import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Notification } from './entities/notification.entity';

@Injectable()
export class RedisNotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly NOTIFICATIONS_CHANNEL = 'notifications.created';
  private readonly NOTIFICATIONS_PATTERN = 'notifications.*';
  private instanceId: string;

  constructor(private readonly redis: RedisService) {
    this.instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async onModuleInit() {
    if (this.redis?.isEnabled()) {
      // Subscribe to all notification events
      await this.redis.subscribe(this.NOTIFICATIONS_CHANNEL, this.handleNotification.bind(this));
    }
  }

  async onModuleDestroy() {
    if (this.redis?.isEnabled()) {
      // Unsubscribe not implemented in RedisService yet; safe no-op
    }
  }

  private handleNotification(payload: any) {
    if (!payload) return;
    // Ignore events we originated locally
    if (payload.__origin === this.instanceId) return;

    // Emit to local event emitter or handle directly
    // This will be connected to the main NotificationsService
    return payload;
  }

  async publishNotification(notification: Notification) {
    if (this.redis?.isEnabled()) {
      const payload = {
        ...notification,
        __origin: this.instanceId,
        __timestamp: Date.now(),
      };
      await this.redis.publish(this.NOTIFICATIONS_CHANNEL, payload);
    }
  }

  async subscribeToUserNotifications(
    userId: string,
    tenantId: string,
    callback: (notification: Notification) => void,
  ) {
    if (this.redis?.isEnabled()) {
      const userChannel = `notifications.user.${tenantId}.${userId}`;
      await this.redis.subscribe(userChannel, (payload: any) => {
        if (payload && payload.tenantId === tenantId && payload.userId === userId) {
          callback(payload);
        }
      });
    }
  }

  async publishUserNotification(notification: Notification) {
    if (this.redis?.isEnabled()) {
      const userChannel = `notifications.user.${notification.tenantId}.${notification.userId}`;
      const payload = {
        ...notification,
        __origin: this.instanceId,
        __timestamp: Date.now(),
      };
      await this.redis.publish(userChannel, payload);
    }
  }

  async subscribeToTenantNotifications(
    tenantId: string,
    callback: (notification: Notification) => void,
  ) {
    if (this.redis?.isEnabled()) {
      const tenantChannel = `notifications.tenant.${tenantId}`;
      await this.redis.subscribe(tenantChannel, (payload: any) => {
        if (payload && payload.tenantId === tenantId) {
          callback(payload);
        }
      });
    }
  }

  async publishTenantNotification(notification: Notification) {
    if (this.redis?.isEnabled()) {
      const tenantChannel = `notifications.tenant.${notification.tenantId}`;
      const payload = {
        ...notification,
        __origin: this.instanceId,
        __timestamp: Date.now(),
      };
      await this.redis.publish(tenantChannel, payload);
    }
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}
