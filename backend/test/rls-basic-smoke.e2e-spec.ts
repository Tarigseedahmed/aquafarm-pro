import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantFarmUser, buildAuthHeaders } from './utils/seeding';

// Lightweight RLS smoke test to quickly ensure SET app.tenant_id + policies prevent cross-tenant leakage.
// Runs only when DB_TYPE=postgres (skipped for sqlite to keep matrix fast).
const run = process.env.DB_TYPE === 'postgres';

(run ? describe : describe.skip)('RLS basic smoke', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwt: JwtService;
  let tenantA: any;
  let tenantB: any;

  beforeAll(async () => {
    process.env.MIGRATIONS_RUN = 'true';
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    dataSource = app.get(DataSource);
    jwt = app.get(JwtService);
    tenantA = await seedTenantFarmUser(
      dataSource,
      jwt,
      'rls-smoke-a',
      'RLS Smoke A',
    );
    tenantB = await seedTenantFarmUser(
      dataSource,
      jwt,
      'rls-smoke-b',
      'RLS Smoke B',
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('does not leak ponds between tenants', async () => {
    // Create pond under tenant A
    const createRes = await request(app.getHttpServer())
      .post('/ponds')
      .set(buildAuthHeaders(tenantA))
      .send({ name: 'RLSBasicPond', area: 10, depth: 1, maxCapacity: 50, farmId: tenantA.farmId });
    expect(createRes.status).toBe(201);

    // List ponds as tenant B => should not see that pond
    const listRes = await request(app.getHttpServer())
      .get('/ponds')
      .set(buildAuthHeaders(tenantB));
    expect(listRes.status).toBe(200);
    const ponds = listRes.body.ponds || listRes.body.data || listRes.body; // tolerate different envelope phases
    const flat = Array.isArray(ponds) ? ponds : ponds.items || ponds.data || [];
    expect(flat.some((p: any) => p.name === 'RLSBasicPond')).toBeFalsy();
  });
});
