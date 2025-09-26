import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantFarmUser, buildAuthHeaders } from './utils/seeding';

const shouldRun = process.env.DB_TYPE === 'postgres';

(shouldRun ? describe : describe.skip)('Postgres RLS (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let tenantA: any;
  let tenantB: any;

  beforeAll(async () => {
    if (!shouldRun) return;
    process.env.MIGRATIONS_RUN = 'true';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    tenantA = await seedTenantFarmUser(dataSource, jwtService, 'tenant-a', 'Tenant A');
    tenantB = await seedTenantFarmUser(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('enforces isolation at DB level', async () => {
    const create = await request(app.getHttpServer())
      .post('/ponds')
      .set(buildAuthHeaders(tenantA))
      .send({ name: 'RLSPond A1', farmId: tenantA.farmId, area: 50, depth: 1.2, maxCapacity: 200 });
    expect(create.status).toBe(201);
    const listB = await request(app.getHttpServer())
      .get('/ponds')
      .set(buildAuthHeaders(tenantB));
    expect(listB.status).toBe(200);
    const pondsB = listB.body.ponds || listB.body;
    expect(pondsB.some((p: any) => p.name === 'RLSPond A1')).toBeFalsy();
  });

  it('prevents direct record access across tenants (404/403)', async () => {
    const create = await request(app.getHttpServer())
      .post('/ponds')
      .set(buildAuthHeaders(tenantA))
      .send({ name: 'RLSPond A2', farmId: tenantA.farmId, area: 30, depth: 1, maxCapacity: 120 });
    expect(create.status).toBe(201);
    const id = create.body.id;
    const get = await request(app.getHttpServer())
      .get(`/ponds/${id}`)
      .set(buildAuthHeaders(tenantB));
    expect([403, 404]).toContain(get.status);
  });
});
