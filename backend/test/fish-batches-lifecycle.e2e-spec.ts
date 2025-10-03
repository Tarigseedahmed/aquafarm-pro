import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders, SeedWithPond } from './utils/seeding';

describe('Fish Batches lifecycle (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  const seeded: Record<string, SeedWithPond> = {};

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-fish-batches-lifecycle.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    seeded['tenant-a'] = await seedTenantWithPond(dataSource, jwtService, 'tenant-a', 'Tenant A');
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) await app.close();
  });

  const authHeaders = (record: SeedWithPond) => buildAuthHeaders(record);

  it('creates fish batch with lifecycle fields', async () => {
    const tenantA = seeded['tenant-a'];

    const batchData = {
      batchNumber: 'BATCH-001',
      species: 'Tilapia',
      variety: 'Nile Tilapia',
      initialCount: 1000,
      averageWeight: 25.5, // grams
      pondId: tenantA.pondId,
      stockingDate: '2024-01-15',
      expectedHarvestDate: '2024-06-15',
      supplier: 'AquaFarm Supplier',
      notes: 'High quality fingerlings',
    };

    const response = await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send(batchData)
      .expect(201);

    expect(response.body.batchNumber).toBe('BATCH-001');
    expect(response.body.species).toBe('Tilapia');
    expect(response.body.variety).toBe('Nile Tilapia');
    expect(response.body.initialCount).toBe(1000);
    expect(response.body.currentCount).toBe(1000); // Should match initial
    expect(response.body.averageWeight).toBe(25.5);
    expect(response.body.totalBiomass).toBe(25500); // 1000 * 25.5
    expect(response.body.status).toBe('active');
    expect(response.body.pondId).toBe(tenantA.pondId);
    expect(response.body.managedById).toBe(tenantA.userId);
    expect(response.body.tenantId).toBe(tenantA.tenantId);
    expect(response.body.supplier).toBe('AquaFarm Supplier');
    expect(response.body.notes).toBe('High quality fingerlings');

    return response.body.id;
  });

  it('updates fish batch lifecycle metrics', async () => {
    const tenantA = seeded['tenant-a'];

    // Create initial batch
    const createResponse = await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send({
        batchNumber: 'BATCH-002',
        species: 'Salmon',
        initialCount: 500,
        averageWeight: 30.0,
        pondId: tenantA.pondId,
        stockingDate: '2024-01-01',
      })
      .expect(201);

    const batchId = createResponse.body.id;

    // Update lifecycle metrics
    const updateData = {
      currentCount: 480, // Some mortality
      averageWeight: 45.0, // Growth
      survivalRate: 96.0, // 480/500 * 100
      feedConversionRatio: 1.8,
      targetWeight: 200.0,
      healthStatus: {
        diseases: ['none'],
        treatments: ['vaccination'],
        mortality: 20,
      },
    };

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/fish-batches/${batchId}`)
      .set(authHeaders(tenantA))
      .send(updateData)
      .expect(200);

    expect(updateResponse.body.currentCount).toBe(480);
    expect(updateResponse.body.averageWeight).toBe(45.0);
    expect(updateResponse.body.totalBiomass).toBe(21600); // 480 * 45
    expect(updateResponse.body.survivalRate).toBe(96.0);
    expect(updateResponse.body.feedConversionRatio).toBe(1.8);
    expect(updateResponse.body.targetWeight).toBe(200.0);
    expect(updateResponse.body.healthStatus).toEqual(updateData.healthStatus);
  });

  it('tracks harvest lifecycle', async () => {
    const tenantA = seeded['tenant-a'];

    // Create batch ready for harvest
    const createResponse = await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send({
        batchNumber: 'BATCH-003',
        species: 'Carp',
        initialCount: 800,
        averageWeight: 180.0, // Ready for harvest
        pondId: tenantA.pondId,
        stockingDate: '2023-06-01',
        expectedHarvestDate: '2024-01-01',
      })
      .expect(201);

    const batchId = createResponse.body.id;

    // Mark as harvested
    const harvestData = {
      status: 'harvested',
      actualHarvestDate: '2024-01-15',
      currentCount: 750, // Final count
      averageWeight: 200.0, // Final weight
      survivalRate: 93.75, // 750/800 * 100
      feedConversionRatio: 2.1,
    };

    const harvestResponse = await request(app.getHttpServer())
      .patch(`/api/fish-batches/${batchId}`)
      .set(authHeaders(tenantA))
      .send(harvestData)
      .expect(200);

    expect(harvestResponse.body.status).toBe('harvested');
    expect(harvestResponse.body.actualHarvestDate).toBe('2024-01-15');
    expect(harvestResponse.body.currentCount).toBe(750);
    expect(harvestResponse.body.averageWeight).toBe(200.0);
    expect(harvestResponse.body.totalBiomass).toBe(150000); // 750 * 200
    expect(harvestResponse.body.survivalRate).toBe(93.75);
    expect(harvestResponse.body.feedConversionRatio).toBe(2.1);
  });

  it('filters batches by lifecycle status', async () => {
    const tenantA = seeded['tenant-a'];

    // Create batches with different statuses
    await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send({
        batchNumber: 'ACTIVE-001',
        species: 'Tilapia',
        initialCount: 1000,
        averageWeight: 25.0,
        pondId: tenantA.pondId,
        status: 'active',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send({
        batchNumber: 'HARVESTED-001',
        species: 'Salmon',
        initialCount: 500,
        averageWeight: 200.0,
        pondId: tenantA.pondId,
        status: 'harvested',
      })
      .expect(201);

    // Filter by active status
    const activeResponse = await request(app.getHttpServer())
      .get('/api/fish-batches?status=active')
      .set(authHeaders(tenantA))
      .expect(200);

    const activeBatches =
      activeResponse.body.data || activeResponse.body.batches || activeResponse.body;
    expect(Array.isArray(activeBatches)).toBe(true);
    expect(activeBatches.every((batch: any) => batch.status === 'active')).toBe(true);

    // Filter by harvested status
    const harvestedResponse = await request(app.getHttpServer())
      .get('/api/fish-batches?status=harvested')
      .set(authHeaders(tenantA))
      .expect(200);

    const harvestedBatches =
      harvestedResponse.body.data || harvestedResponse.body.batches || harvestedResponse.body;
    expect(Array.isArray(harvestedBatches)).toBe(true);
    expect(harvestedBatches.every((batch: any) => batch.status === 'harvested')).toBe(true);
  });

  it('calculates biomass automatically on updates', async () => {
    const tenantA = seeded['tenant-a'];

    // Create batch
    const createResponse = await request(app.getHttpServer())
      .post('/api/fish-batches')
      .set(authHeaders(tenantA))
      .send({
        batchNumber: 'BIOMASS-001',
        species: 'Bass',
        initialCount: 300,
        averageWeight: 50.0,
        pondId: tenantA.pondId,
      })
      .expect(201);

    const batchId = createResponse.body.id;
    expect(createResponse.body.totalBiomass).toBe(15000); // 300 * 50

    // Update count and weight
    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/fish-batches/${batchId}`)
      .set(authHeaders(tenantA))
      .send({
        currentCount: 280,
        averageWeight: 75.0,
      })
      .expect(200);

    expect(updateResponse.body.currentCount).toBe(280);
    expect(updateResponse.body.averageWeight).toBe(75.0);
    expect(updateResponse.body.totalBiomass).toBe(21000); // 280 * 75
  });
});
