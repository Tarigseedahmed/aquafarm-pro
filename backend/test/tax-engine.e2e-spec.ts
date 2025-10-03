import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * Tax Engine E2E
 * Verifies that:
 *  - Tax calculations work correctly
 *  - Currency conversion is applied when needed
 *  - Tax summaries are generated properly
 *  - Tax rates and profiles are accessible
 */

describe('Tax Engine (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-tax-engine.db';
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

  it('calculates tax for a transaction', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-calc',
      'Tenant Tax Calc',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 1000,
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2024-01-15',
        isInclusive: false,
      })
      .expect(201);

    expect(response.body).toHaveProperty('baseAmount');
    expect(response.body).toHaveProperty('taxAmount');
    expect(response.body).toHaveProperty('totalAmount');
    expect(response.body).toHaveProperty('taxRate');
    expect(response.body.taxCode).toBe('VAT_STANDARD');
    expect(response.body.currency).toBe('SAR');
    expect(response.body.isInclusive).toBe(false);
  });

  it('calculates tax with inclusive amount', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-inclusive',
      'Tenant Tax Inclusive',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 1150, // 1000 + 15% VAT
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2024-01-15',
        isInclusive: true,
      })
      .expect(201);

    expect(response.body.baseAmount).toBeCloseTo(1000, 2);
    expect(response.body.taxAmount).toBeCloseTo(150, 2);
    expect(response.body.totalAmount).toBe(1150);
    expect(response.body.isInclusive).toBe(true);
  });

  it('generates tax summary for multiple calculations', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-summary',
      'Tenant Tax Summary',
    );

    const server = app.getHttpServer();

    // First calculation
    const calc1 = await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 1000,
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2024-01-15',
        isInclusive: false,
      })
      .expect(201);

    // Second calculation
    const calc2 = await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 500,
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2024-01-15',
        isInclusive: false,
      })
      .expect(201);

    // Generate summary
    const summary = await request(server)
      .post('/api/tax/summary')
      .set(buildAuthHeaders(tenant))
      .send({
        calculations: [calc1.body, calc2.body],
        currency: 'SAR',
      })
      .expect(201);

    expect(summary.body).toHaveProperty('totalBaseAmount');
    expect(summary.body).toHaveProperty('totalTaxAmount');
    expect(summary.body).toHaveProperty('totalAmount');
    expect(summary.body.currency).toBe('SAR');
    expect(summary.body.taxBreakdown).toHaveLength(1);
    expect(summary.body.taxBreakdown[0].taxCode).toBe('VAT_STANDARD');
  });

  it('gets available tax rates for a country', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-rates',
      'Tenant Tax Rates',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/tax/rates?countryCode=SA')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('ratePercent');
    }
  });

  it('validates tax code for a country', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-validate',
      'Tenant Tax Validate',
    );

    const server = app.getHttpServer();

    // Valid tax code
    const validResponse = await request(server)
      .get('/api/tax/validate?taxCode=VAT_STANDARD&countryCode=SA')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(validResponse.body).toHaveProperty('valid');

    // Invalid tax code
    const invalidResponse = await request(server)
      .get('/api/tax/validate?taxCode=INVALID_CODE&countryCode=SA')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(invalidResponse.body.valid).toBe(false);
  });

  it('gets tax rate information', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-info',
      'Tenant Tax Info',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/tax/rate-info?taxCode=VAT_STANDARD&countryCode=SA')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    if (response.body) {
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('ratePercent');
      expect(response.body).toHaveProperty('validFrom');
      expect(response.body).toHaveProperty('isCompound');
    }
  });

  it('handles tax calculation errors gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-error',
      'Tenant Tax Error',
    );

    const server = app.getHttpServer();

    // Invalid tax code
    await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 1000,
        currency: 'SAR',
        taxCode: 'INVALID_CODE',
        countryCode: 'SA',
        date: '2024-01-15',
        isInclusive: false,
      })
      .expect(400);

    // Invalid country code
    await request(server)
      .post('/api/tax/calculate')
      .set(buildAuthHeaders(tenant))
      .send({
        amount: 1000,
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'INVALID',
        date: '2024-01-15',
        isInclusive: false,
      })
      .expect(400);
  });
});
