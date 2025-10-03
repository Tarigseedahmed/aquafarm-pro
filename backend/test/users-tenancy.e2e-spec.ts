import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantFarmUser, buildAuthHeaders, SeedBasic } from './utils/seeding';

describe('Users tenancy scoping (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedBasic> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-tenant-users.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

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

  it('lists only users within the same tenant for non-admins', async () => {
    const tenantA = seeded['tenant-a'];
    const tenantB = seeded['tenant-b'];

    // Tenant A lists users
    const resA = await request(app.getHttpServer())
      .get('/api/users')
      .set(authHeaders(tenantA))
      .expect(200);
    const usersA = resA.body.data || resA.body.items || resA.body;
    expect(Array.isArray(usersA)).toBe(true);
    // Should include A's email and not B's
    expect(usersA.some((u: any) => String(u.email).includes('tenant-a@test.local'))).toBeTruthy();
    expect(usersA.some((u: any) => String(u.email).includes('tenant-b@test.local'))).toBeFalsy();

    // Tenant B lists users
    const resB = await request(app.getHttpServer())
      .get('/api/users')
      .set(authHeaders(tenantB))
      .expect(200);
    const usersB = resB.body.data || resB.body.items || resB.body;
    expect(Array.isArray(usersB)).toBe(true);
    expect(usersB.some((u: any) => String(u.email).includes('tenant-b@test.local'))).toBeTruthy();
    expect(usersB.some((u: any) => String(u.email).includes('tenant-a@test.local'))).toBeFalsy();
  });
});
