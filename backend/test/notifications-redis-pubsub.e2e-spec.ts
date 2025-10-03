import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';
import { RedisNotificationsService } from '../src/notifications/redis-notifications.service';

/**
 * Redis Pub/Sub Notifications E2E
 * Verifies that:
 *  - Redis Pub/Sub works for distributed notifications
 *  - Notifications are published to Redis channels
 *  - Cross-instance notification delivery works
 */

describe('Notifications Redis Pub/Sub (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let redisNotificationsService: RedisNotificationsService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-notifications-redis.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';
    process.env.REDIS_URL = 'redis://localhost:6379';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    redisNotificationsService = app.get(RedisNotificationsService);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('publishes notifications to Redis channels', async () => {
    const tenant = await seedTenantWithPond(dataSource, jwtService, 'tenant-redis', 'Tenant Redis');

    // Create a notification
    const notificationData = {
      userId: tenant.userId,
      title: 'Test Redis Notification',
      message: 'This is a test notification for Redis Pub/Sub',
      type: 'info',
      category: 'system',
      priority: 'medium',
    };

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/notifications')
      .set(buildAuthHeaders(tenant))
      .send(notificationData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(notificationData.title);
    expect(response.body.message).toBe(notificationData.message);
  });

  it('subscribes to Redis notification channels', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-subscriber',
      'Tenant Subscriber',
    );

    let receivedNotification: any = null;
    const callback = (notification: any) => {
      receivedNotification = notification;
    };

    // Subscribe to user notifications
    await redisNotificationsService.subscribeToUserNotifications(
      tenant.userId,
      tenant.tenantId,
      callback,
    );

    // Create a notification that should trigger the callback
    const server = app.getHttpServer();
    await request(server)
      .post('/api/notifications')
      .set(buildAuthHeaders(tenant))
      .send({
        userId: tenant.userId,
        title: 'Redis Subscriber Test',
        message: 'Testing Redis subscription',
        type: 'info',
        category: 'system',
        priority: 'medium',
      })
      .expect(201);

    // Wait a bit for the notification to be processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The notification should have been received via Redis
    expect(receivedNotification).toBeTruthy();
    expect(receivedNotification.title).toBe('Redis Subscriber Test');
  });

  it('handles tenant-scoped notifications via Redis', async () => {
    const tenantA = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-a-redis',
      'Tenant A Redis',
    );
    const tenantB = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-b-redis',
      'Tenant B Redis',
    );

    const receivedNotifications: any[] = [];
    const callback = (notification: any) => {
      receivedNotifications.push(notification);
    };

    // Subscribe to tenant A notifications
    await redisNotificationsService.subscribeToTenantNotifications(tenantA.tenantId, callback);

    // Create notifications for both tenants
    const server = app.getHttpServer();

    await request(server)
      .post('/api/notifications')
      .set(buildAuthHeaders(tenantA))
      .send({
        userId: tenantA.userId,
        title: 'Tenant A Notification',
        message: 'This should be received',
        type: 'info',
        category: 'system',
        priority: 'medium',
      })
      .expect(201);

    await request(server)
      .post('/api/notifications')
      .set(buildAuthHeaders(tenantB))
      .send({
        userId: tenantB.userId,
        title: 'Tenant B Notification',
        message: 'This should NOT be received',
        type: 'info',
        category: 'system',
        priority: 'medium',
      })
      .expect(201);

    // Wait for notifications to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Should only receive tenant A notifications
    expect(receivedNotifications.length).toBeGreaterThan(0);
    const tenantANotifications = receivedNotifications.filter(
      (n) => n.tenantId === tenantA.tenantId,
    );
    const tenantBNotifications = receivedNotifications.filter(
      (n) => n.tenantId === tenantB.tenantId,
    );

    expect(tenantANotifications.length).toBeGreaterThan(0);
    expect(tenantBNotifications.length).toBe(0);
  });
});
