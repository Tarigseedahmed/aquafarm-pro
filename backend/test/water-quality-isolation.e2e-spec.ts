import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';

describe('Water Quality tenant isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedWithPond> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-water-quality-isolation.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-a', 'Tenant A');
    seeded['tenant-b'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) await app.close();
  });

  const authHeaders = (record: SeedWithPond) => buildAuthHeaders(record);

  it('isolates water quality readings between tenants', async () => {
    const tenantA = seeded['tenant-a'];
    const tenantB = seeded['tenant-b'];

    // Create reading for tenant A
    const readingA = await request(app.getHttpServer())
      .post('/api/water-quality')
      .set(authHeaders(tenantA))
      .send({
        temperature: 25.5,
        ph: 7.2,
        dissolvedOxygen: 8.5,
        ammonia: 0.2,
        nitrite: 0.1,
        nitrate: 5.0,
        pondId: tenantA.pondId,
        recordedById: tenantA.userId,
        readingMethod: 'manual',
        notes: 'Good water quality for tenant A',
      })
      .expect(201);

    // Create reading for tenant B
    const readingB = await request(app.getHttpServer())
      .post('/api/water-quality')
      .set(authHeaders(tenantB))
      .send({
        temperature: 28.0,
        ph: 6.8,
        dissolvedOxygen: 7.2,
        ammonia: 0.5,
        nitrite: 0.3,
        nitrate: 8.0,
        pondId: tenantB.pondId,
        recordedById: tenantB.userId,
        readingMethod: 'manual',
        notes: 'Different quality for tenant B',
      })
      .expect(201);

    // List readings for tenant A
    const listA = await request(app.getHttpServer())
      .get('/api/water-quality')
      .set(authHeaders(tenantA))
      .expect(200);

    const readingsA = listA.body.data || listA.body.items || listA.body;
    expect(Array.isArray(readingsA)).toBe(true);
    expect(readingsA.some((r: any) => r.id === readingA.body.id)).toBeTruthy();
    expect(readingsA.some((r: any) => r.id === readingB.body.id)).toBeFalsy();

    // List readings for tenant B
    const listB = await request(app.getHttpServer())
      .get('/api/water-quality')
      .set(authHeaders(tenantB))
      .expect(200);

    const readingsB = listB.body.data || listB.body.items || listB.body;
    expect(Array.isArray(readingsB)).toBe(true);
    expect(readingsB.some((r: any) => r.id === readingB.body.id)).toBeTruthy();
    expect(readingsB.some((r: any) => r.id === readingA.body.id)).toBeFalsy();
  });

  it('isolates water quality trends between tenants', async () => {
    const tenantA = seeded['tenant-a'];
    const tenantB = seeded['tenant-b'];

    // Create multiple readings for tenant A
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/api/water-quality')
        .set(authHeaders(tenantA))
        .send({
          temperature: 25.0 + i,
          ph: 7.0 + i * 0.1,
          dissolvedOxygen: 8.0 + i,
          ammonia: 0.1 + i * 0.1,
          nitrite: 0.05 + i * 0.05,
          nitrate: 5.0 + i,
          pondId: tenantA.pondId,
          recordedById: tenantA.userId,
          readingMethod: 'manual',
        })
        .expect(201);
    }

    // Create different readings for tenant B
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post('/api/water-quality')
        .set(authHeaders(tenantB))
        .send({
          temperature: 30.0 + i,
          ph: 6.5 + i * 0.2,
          dissolvedOxygen: 6.0 + i,
          ammonia: 0.8 + i * 0.2,
          nitrite: 0.4 + i * 0.1,
          nitrate: 10.0 + i,
          pondId: tenantB.pondId,
          recordedById: tenantB.userId,
          readingMethod: 'manual',
        })
        .expect(201);
    }

    // Get trends for tenant A
    const trendsA = await request(app.getHttpServer())
      .get(`/api/water-quality/trends/${tenantA.pondId}`)
      .set(authHeaders(tenantA))
      .expect(200);

    expect(trendsA.body.pondId).toBe(tenantA.pondId);
    expect(trendsA.body.totalReadings).toBeGreaterThanOrEqual(3);
    expect(trendsA.body.trends).toBeDefined();
    expect(trendsA.body.trends.temperature).toBeDefined();

    // Get trends for tenant B
    const trendsB = await request(app.getHttpServer())
      .get(`/api/water-quality/trends/${tenantB.pondId}`)
      .set(authHeaders(tenantB))
      .expect(200);

    expect(trendsB.body.pondId).toBe(tenantB.pondId);
    expect(trendsB.body.totalReadings).toBeGreaterThanOrEqual(2);
    expect(trendsB.body.trends).toBeDefined();
    expect(trendsB.body.trends.temperature).toBeDefined();

    // Verify trends are different between tenants
    expect(trendsA.body.trends.temperature.average).not.toBe(
      trendsB.body.trends.temperature.average,
    );
  });

  it('prevents cross-tenant access to individual readings', async () => {
    const tenantA = seeded['tenant-a'];
    const tenantB = seeded['tenant-b'];

    // Create reading for tenant A
    const readingA = await request(app.getHttpServer())
      .post('/api/water-quality')
      .set(authHeaders(tenantA))
      .send({
        temperature: 25.5,
        ph: 7.2,
        dissolvedOxygen: 8.5,
        ammonia: 0.2,
        nitrite: 0.1,
        nitrate: 5.0,
        pondId: tenantA.pondId,
        recordedById: tenantA.userId,
        readingMethod: 'manual',
      })
      .expect(201);

    // Try to access tenant A's reading from tenant B
    await request(app.getHttpServer())
      .get(`/api/water-quality/${readingA.body.id}`)
      .set(authHeaders(tenantB))
      .expect(404);
  });
});
