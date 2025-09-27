import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';
import { JwtService } from '@nestjs/jwt';
import { Notification } from '../src/notifications/entities/notification.entity';

// Notification isolation test — ensures notifications for one tenant/user are not visible to another tenant.

describe('Notifications Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let notifRepo: Repository<Notification>;
  let jwtService: JwtService;
  const seeded: Record<string, SeedWithPond> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-notifications-isolation.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    notifRepo = dataSource.getRepository(Notification);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-a', 'Tenant A');
    seeded['tenant-b'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  const authHeaders = (record: SeedWithPond) => buildAuthHeaders(record);

  async function createNotification(code: string, overrides: Partial<Notification> = {}) {
    const rec = seeded[code];
    const notif = notifRepo.create({
      title: `Test Notification ${code}`,
      message: `Message for ${code}`,
      type: 'info',
      category: 'system',
      isRead: false,
      priority: 'low',
      userId: rec.userId,
      tenantId: rec.tenantId,
      ...overrides,
    });
    return notifRepo.save(notif);
  }

  it('keeps notifications separate per tenant', async () => {
    const a = seeded['tenant-a'];
    const b = seeded['tenant-b'];

    await createNotification('tenant-a');
    await createNotification('tenant-b');

    const listA = await request(app.getHttpServer())
      .get('/api/notifications?page=1&limit=50')
      .set(authHeaders(a));
    expect(listA.status).toBe(200);
    expect(listA.body).toHaveProperty('data');
    expect(listA.body).toHaveProperty('meta');
    expect(Array.isArray(listA.body.data)).toBe(true);
    expect(listA.body.data.every((n: any) => n.tenantId === a.tenantId)).toBe(true);
    expect(listA.body.data.some((n: any) => n.message.includes('tenant-b'))).toBe(false);

    const listB = await request(app.getHttpServer())
      .get('/api/notifications?page=1&limit=50')
      .set(authHeaders(b));
    expect(listB.status).toBe(200);
    expect(listB.body).toHaveProperty('data');
    expect(listB.body).toHaveProperty('meta');
    expect(Array.isArray(listB.body.data)).toBe(true);
    expect(listB.body.data.every((n: any) => n.tenantId === b.tenantId)).toBe(true);
    expect(listB.body.data.some((n: any) => n.message.includes('tenant-a'))).toBe(false);
  });

  it('unread count is tenant + user specific', async () => {
    const a = seeded['tenant-a'];
    const b = seeded['tenant-b'];

    // mark existing as read for clean count
    await notifRepo.update({ tenantId: a.tenantId, userId: a.userId }, { isRead: true });
    await notifRepo.update({ tenantId: b.tenantId, userId: b.userId }, { isRead: true });

    await createNotification('tenant-a', { isRead: false });
    await createNotification('tenant-a', { isRead: false });
    await createNotification('tenant-b', { isRead: false });

    const unreadA = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set(authHeaders(a));
    expect(unreadA.status).toBe(200);
    expect(unreadA.body).toHaveProperty('count');
    expect(unreadA.body.count).toBeGreaterThanOrEqual(2);

    const unreadB = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set(authHeaders(b));
    expect(unreadB.status).toBe(200);
    expect(unreadB.body.count).toBeGreaterThanOrEqual(1);
  });
});
