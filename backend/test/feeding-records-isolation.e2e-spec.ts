import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';

describe('Feeding Records Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedWithPond> = {};
  const batches: Record<string, string> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-feeding-records-isolation.db';
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

    // Create one batch per tenant directly via API to ensure correct defaults
    for (const code of ['tenant-a', 'tenant-b']) {
      const rec = seeded[code];
      const res = await request(app.getHttpServer())
        .post('/fish-batches')
        .set(buildAuthHeaders(rec))
        .send({
          batchNumber: code === 'tenant-a' ? 'A-B1' : 'B-B1',
          species: 'Tilapia',
          initialCount: 500,
          averageWeight: 10,
          pondId: rec.pondId,
        });
      if (res.status !== 201) {
        // eslint-disable-next-line no-console
        console.log('Fish batch creation failed', code, res.body);
      }
      batches[code] = res.body.id;
    }
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  const auth = (r: SeedWithPond) => buildAuthHeaders(r);

  it('keeps feeding records isolated per tenant', async () => {
    const a = seeded['tenant-a'];
    const b = seeded['tenant-b'];

    const feedA = await request(app.getHttpServer()).post('/feeding-records').set(auth(a)).send({
      fishBatchId: batches['tenant-a'],
      feedAmount: 5.5,
      feedType: 'Grower',
      feedingTime: '08:00:00',
    });
    expect(feedA.status).toBe(201);

    const feedB = await request(app.getHttpServer()).post('/feeding-records').set(auth(b)).send({
      fishBatchId: batches['tenant-b'],
      feedAmount: 4.1,
      feedType: 'Starter',
      feedingTime: '09:00:00',
    });
    expect(feedB.status).toBe(201);

    const listA = await request(app.getHttpServer()).get('/feeding-records').set(auth(a));
    expect(listA.status).toBe(200);
    const recsA = listA.body.records || listA.body;
    expect(recsA.some((r: any) => r.fishBatchId === batches['tenant-a'])).toBeTruthy();
    expect(recsA.some((r: any) => r.fishBatchId === batches['tenant-b'])).toBeFalsy();

    const listB = await request(app.getHttpServer()).get('/feeding-records').set(auth(b));
    expect(listB.status).toBe(200);
    const recsB = listB.body.records || listB.body;
    expect(recsB.some((r: any) => r.fishBatchId === batches['tenant-b'])).toBeTruthy();
    expect(recsB.some((r: any) => r.fishBatchId === batches['tenant-a'])).toBeFalsy();
  });
});
