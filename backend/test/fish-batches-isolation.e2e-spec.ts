import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';

describe('Fish Batches Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedWithPond> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-fish-batches-isolation.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-a', 'Tenant A');
    seeded['tenant-b'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-b', 'Tenant B');
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  const auth = (r: SeedWithPond) => buildAuthHeaders(r);

  it('keeps fish batches separate per tenant', async () => {
    const a = seeded['tenant-a'];
    const b = seeded['tenant-b'];

    const createA = await request(app.getHttpServer()).post('/fish-batches').set(auth(a)).send({
      batchNumber: 'A-BATCH-1',
      species: 'Tilapia',
      initialCount: 1000,
      averageWeight: 15.5,
      pondId: a.pondId,
    });
    expect(createA.status).toBe(201);

    const createB = await request(app.getHttpServer()).post('/fish-batches').set(auth(b)).send({
      batchNumber: 'B-BATCH-1',
      species: 'Catfish',
      initialCount: 800,
      averageWeight: 12.3,
      pondId: b.pondId,
    });
    expect(createB.status).toBe(201);

    const listA = await request(app.getHttpServer()).get('/fish-batches').set(auth(a));
    expect(listA.status).toBe(200);
    const batchesA = listA.body.batches || listA.body;
    expect(batchesA.some((b: any) => b.batchNumber === 'A-BATCH-1')).toBeTruthy();
    expect(batchesA.some((b: any) => b.batchNumber === 'B-BATCH-1')).toBeFalsy();

    const listB = await request(app.getHttpServer()).get('/fish-batches').set(auth(b));
    expect(listB.status).toBe(200);
    const batchesB = listB.body.batches || listB.body;
    expect(batchesB.some((b: any) => b.batchNumber === 'B-BATCH-1')).toBeTruthy();
    expect(batchesB.some((b: any) => b.batchNumber === 'A-BATCH-1')).toBeFalsy();
  });
});
