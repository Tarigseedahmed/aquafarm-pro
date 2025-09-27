import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';
import { JwtService } from '@nestjs/jwt';

// Water quality readings must not leak between tenants.

describe('Water Quality Tenant Isolation (e2e)', () => {
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
    // Reuse unified bootstrap to ensure pagination + swagger etc.
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-a', 'Tenant A');
    seeded['tenant-b'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  const authHeaders = (record: SeedWithPond) => buildAuthHeaders(record);

  it('prevents reading leakage between tenants', async () => {
    const a = seeded['tenant-a'];
    const b = seeded['tenant-b'];

    // Create reading for tenant A pond
    const createA = await request(app.getHttpServer())
      .post('/api/water-quality')
      .set(authHeaders(a))
      .send({
        pondId: a.pondId,
        temperature: 25.2,
        ph: 7.4,
        dissolvedOxygen: 6.1,
        ammonia: 0.3,
        nitrite: 0.1,
        nitrate: 10,
        recordedById: a.userId,
        readingMethod: 'sensor',
      });
    expect(createA.status).toBe(201);

    // Create reading for tenant B pond
    const createB = await request(app.getHttpServer())
      .post('/api/water-quality')
      .set(authHeaders(b))
      .send({
        pondId: b.pondId,
        temperature: 26.5,
        ph: 7.8,
        dissolvedOxygen: 5.5,
        ammonia: 0.5,
        nitrite: 0.2,
        nitrate: 18,
        recordedById: b.userId,
        readingMethod: 'manual',
      });
    expect(createB.status).toBe(201);

    // List A
    const listA = await request(app.getHttpServer()).get('/api/water-quality').set(authHeaders(a));
    expect(listA.status).toBe(200);
    expect(Array.isArray(listA.body.data)).toBe(true);
    expect(listA.body.meta).toBeDefined();
    expect(listA.body.data.some((r: any) => r.pondId === a.pondId)).toBeTruthy();
    expect(listA.body.data.some((r: any) => r.pondId === b.pondId)).toBeFalsy();

    // List B
    const listB = await request(app.getHttpServer()).get('/api/water-quality').set(authHeaders(b));
    expect(listB.status).toBe(200);
    expect(Array.isArray(listB.body.data)).toBe(true);
    expect(listB.body.meta).toBeDefined();
    expect(listB.body.data.some((r: any) => r.pondId === b.pondId)).toBeTruthy();
    expect(listB.body.data.some((r: any) => r.pondId === a.pondId)).toBeFalsy();
  });
});
