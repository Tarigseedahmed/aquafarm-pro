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

  it('paginates notifications with consistent meta on page 2', async () => {
    const rec = seeded['tenant-a'];
    // seed > 55 notifications to span at least 2 pages (limit=50 default)
    for (let i = 0; i < 55; i++) {
      await createNotification('tenant-a', { title: `Paged N${i}` });
    }
    const page2 = await request(app.getHttpServer())
      .get('/api/notifications?page=2&limit=20')
      .set(authHeaders(rec));
    expect(page2.status).toBe(200);
    expect(page2.body).toHaveProperty('data');
    expect(page2.body).toHaveProperty('meta');
    expect(page2.body.meta.page).toBe(2);
    expect(page2.body.meta.limit).toBe(20);
    expect(page2.body.meta.total).toBeGreaterThanOrEqual(55); // includes earlier seeded rows
    const expectedTotalPages = Math.ceil(page2.body.meta.total / 20);
    expect(page2.body.meta.totalPages).toBe(expectedTotalPages);
    // Ensure no duplicate ids within page slice
    const ids = page2.body.data.map((n: any) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
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

  it('marks a batch of notifications as read', async () => {
    const rec = seeded['tenant-a'];
    // seed 3 unread notifications
    const n1 = await createNotification('tenant-a', { isRead: false });
    const n2 = await createNotification('tenant-a', { isRead: false });
    const n3 = await createNotification('tenant-a', { isRead: false });

    const res = await request(app.getHttpServer())
      .post('/api/notifications/mark-batch-read')
      .set(authHeaders(rec))
      .send({ ids: [n1.id, n2.id] });
    expect(res.status).toBe(201); // POST default
    expect(res.body).toHaveProperty('updated');
    expect(res.body.updated).toBe(2);

    const refreshed1 = await notifRepo.findOne({ where: { id: n1.id } });
    const refreshed2 = await notifRepo.findOne({ where: { id: n2.id } });
    const refreshed3 = await notifRepo.findOne({ where: { id: n3.id } });
    expect(refreshed1?.isRead).toBe(true);
    expect(refreshed2?.isRead).toBe(true);
    expect(refreshed3?.isRead).toBe(false); // untouched
  });
});
