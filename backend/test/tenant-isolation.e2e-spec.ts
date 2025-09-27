import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import {
  seedTenantFarmUser,
  buildAuthHeaders,
  SeedBasic,
} from './utils/seeding';

// Simple helper to construct auth header or bypass if auth not implemented fully.
// For now we assume JwtAuthGuard expects a user on request; we can mock by overriding guard in test module if needed.

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedBasic> = {};

  beforeAll(async () => {
    // Force isolated sqlite file & auto migrations for this test
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-tenant-isolation.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantFarmUser(dataSource, jwtService, 'tenant-a', 'Tenant A');
    seeded['tenant-b'] = await seedTenantFarmUser(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) await app.close();
  });

  const authHeaders = (record: SeedBasic) => buildAuthHeaders(record);

  it('isolates ponds between two tenants', async () => {
    const tenantA = seeded['tenant-a'];
    const tenantB = seeded['tenant-b'];

    // Create pond under tenant A
    const createA = await request(app.getHttpServer())
      .post('/ponds')
      .set(authHeaders(tenantA))
      .send({ name: 'Pond A1', farmId: tenantA.farmId, area: 100, depth: 2, maxCapacity: 500 });
    if (createA.status !== 201) {
      // eslint-disable-next-line no-console
      console.log('Create A response body:', createA.body);
    }
    expect(createA.status).toBe(201);

    // Create pond under tenant B
    const createB = await request(app.getHttpServer())
      .post('/ponds')
      .set(authHeaders(tenantB))
      .send({ name: 'Pond B1', farmId: tenantB.farmId, area: 80, depth: 1.5, maxCapacity: 300 });
    if (createB.status !== 201) {
      // eslint-disable-next-line no-console
      console.log('Create B response body:', createB.body);
    }
    expect(createB.status).toBe(201);

    // List ponds for tenant A
    const listA = await request(app.getHttpServer())
      .get('/ponds')
      .set(authHeaders(tenantA));

    expect(listA.status).toBe(200);
  const pondsA = listA.body.ponds || listA.body.data || listA.body;
    if (!Array.isArray(pondsA)) {
      // eslint-disable-next-line no-console
      console.log('List A raw body:', listA.body);
    }
    expect(Array.isArray(pondsA)).toBe(true);
    expect(pondsA.some((p: any) => p.name === 'Pond A1')).toBeTruthy();
    expect(pondsA.some((p: any) => p.name === 'Pond B1')).toBeFalsy();

    // List ponds for tenant B
    const listB = await request(app.getHttpServer())
      .get('/ponds')
      .set(authHeaders(tenantB));

    expect(listB.status).toBe(200);
  const pondsB = listB.body.ponds || listB.body.data || listB.body;
    if (!Array.isArray(pondsB)) {
      // eslint-disable-next-line no-console
      console.log('List B raw body:', listB.body);
    }
    expect(pondsB.some((p: any) => p.name === 'Pond B1')).toBeTruthy();
    expect(pondsB.some((p: any) => p.name === 'Pond A1')).toBeFalsy();
  });
});
