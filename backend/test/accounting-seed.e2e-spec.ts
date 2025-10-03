import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * Accounting Seed E2E
 * Verifies that:
 *  - Chart of accounts can be seeded for a tenant
 *  - Tax profiles and rates can be seeded
 *  - Seed status can be checked
 *  - Data is properly isolated by tenant
 */

describe('Accounting Seed (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-accounting-seed.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('seeds chart of accounts for a tenant', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-accounting',
      'Tenant Accounting',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/accounting/seed/chart-of-accounts')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('accountsCreated');
    expect(response.body.accountsCreated).toBeGreaterThan(0);
  });

  it('seeds tax profiles for a tenant', async () => {
    const tenant = await seedTenantWithPond(dataSource, jwtService, 'tenant-tax', 'Tenant Tax');

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/accounting/seed/tax-profiles')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('profilesCreated');
    expect(response.body.profilesCreated).toBeGreaterThan(0);
  });

  it('seeds tax rates for a tenant', async () => {
    const tenant = await seedTenantWithPond(dataSource, jwtService, 'tenant-rates', 'Tenant Rates');

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/accounting/seed/tax-rates')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('ratesCreated');
    expect(response.body.ratesCreated).toBeGreaterThan(0);
  });

  it('seeds all accounting data for a tenant', async () => {
    const tenant = await seedTenantWithPond(dataSource, jwtService, 'tenant-all', 'Tenant All');

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/accounting/seed')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('accountsCreated');
    expect(response.body.data).toHaveProperty('profilesCreated');
    expect(response.body.data).toHaveProperty('ratesCreated');
    expect(response.body.data.accountsCreated).toBeGreaterThan(0);
    expect(response.body.data.profilesCreated).toBeGreaterThan(0);
    expect(response.body.data.ratesCreated).toBeGreaterThan(0);
  });

  it('checks seed status for a tenant', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-status',
      'Tenant Status',
    );

    const server = app.getHttpServer();

    // Check status before seeding
    const statusBefore = await request(server)
      .get('/api/accounting/seed/status')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(statusBefore.body).toHaveProperty('hasSeededData');
    expect(statusBefore.body).toHaveProperty('tenantId');
    expect(statusBefore.body.tenantId).toBe(tenant.tenantId);

    // Seed data
    await request(server).post('/api/accounting/seed').set(buildAuthHeaders(tenant)).expect(201);

    // Check status after seeding
    const statusAfter = await request(server)
      .get('/api/accounting/seed/status')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(statusAfter.body.hasSeededData).toBe(true);
  });

  it('prevents duplicate seeding', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-duplicate',
      'Tenant Duplicate',
    );

    const server = app.getHttpServer();

    // First seeding
    const firstResponse = await request(server)
      .post('/api/accounting/seed')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(firstResponse.body).toHaveProperty('data');

    // Second seeding should indicate data already exists
    const secondResponse = await request(server)
      .post('/api/accounting/seed')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(secondResponse.body).toHaveProperty('message');
    expect(secondResponse.body.message).toContain('already exists');
    expect(secondResponse.body).toHaveProperty('hasData');
    expect(secondResponse.body.hasData).toBe(true);
  });

  it('ensures tenant isolation for accounting data', async () => {
    const tenantA = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-a-isolation',
      'Tenant A Isolation',
    );
    const tenantB = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-b-isolation',
      'Tenant B Isolation',
    );

    const server = app.getHttpServer();

    // Seed data for tenant A
    await request(server).post('/api/accounting/seed').set(buildAuthHeaders(tenantA)).expect(201);

    // Check that tenant B has no seeded data
    const statusB = await request(server)
      .get('/api/accounting/seed/status')
      .set(buildAuthHeaders(tenantB))
      .expect(200);

    expect(statusB.body.hasSeededData).toBe(false);

    // Seed data for tenant B
    await request(server).post('/api/accounting/seed').set(buildAuthHeaders(tenantB)).expect(201);

    // Both tenants should now have data
    const statusA = await request(server)
      .get('/api/accounting/seed/status')
      .set(buildAuthHeaders(tenantA))
      .expect(200);

    const statusBAfter = await request(server)
      .get('/api/accounting/seed/status')
      .set(buildAuthHeaders(tenantB))
      .expect(200);

    expect(statusA.body.hasSeededData).toBe(true);
    expect(statusBAfter.body.hasSeededData).toBe(true);
    expect(statusA.body.tenantId).toBe(tenantA.tenantId);
    expect(statusBAfter.body.tenantId).toBe(tenantB.tenantId);
  });
});
