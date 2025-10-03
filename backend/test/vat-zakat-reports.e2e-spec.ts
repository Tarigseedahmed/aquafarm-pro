import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * VAT & Zakat Reports E2E
 * Verifies that:
 *  - VAT reports are generated correctly
 *  - Zakat reports calculate properly
 *  - Tax summary reports work
 *  - CSV exports function correctly
 */

describe('VAT & Zakat Reports (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-vat-zakat-reports.db';
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

  it('generates VAT report for a period', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-vat-report',
      'Tenant VAT Report',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        countryCode: 'SA',
      })
      .expect(200);

    expect(response.body).toHaveProperty('period');
    expect(response.body).toHaveProperty('totalSales');
    expect(response.body).toHaveProperty('totalPurchases');
    expect(response.body).toHaveProperty('vatCollected');
    expect(response.body).toHaveProperty('vatPaid');
    expect(response.body).toHaveProperty('vatPayable');
    expect(response.body).toHaveProperty('breakdown');
    expect(Array.isArray(response.body.breakdown)).toBe(true);
  });

  it('generates Zakat report for a specific date', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zakat-report',
      'Tenant Zakat Report',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/reports/zakat')
      .set(buildAuthHeaders(tenant))
      .send({
        reportDate: '2024-01-31',
        zakatRate: 2.5,
      })
      .expect(201);

    expect(response.body).toHaveProperty('period');
    expect(response.body).toHaveProperty('totalAssets');
    expect(response.body).toHaveProperty('totalLiabilities');
    expect(response.body).toHaveProperty('netWorth');
    expect(response.body).toHaveProperty('zakatableAssets');
    expect(response.body).toHaveProperty('zakatRate');
    expect(response.body).toHaveProperty('zakatAmount');
    expect(response.body).toHaveProperty('assetBreakdown');
    expect(Array.isArray(response.body.assetBreakdown)).toBe(true);
    expect(response.body.zakatRate).toBe(2.5);
  });

  it('generates tax summary report', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-tax-summary',
      'Tenant Tax Summary',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/reports/tax-summary')
      .set(buildAuthHeaders(tenant))
      .send({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        countryCode: 'SA',
      })
      .expect(201);

    expect(response.body).toHaveProperty('period');
    expect(response.body).toHaveProperty('totalRevenue');
    expect(response.body).toHaveProperty('totalExpenses');
    expect(response.body).toHaveProperty('netIncome');
    expect(response.body).toHaveProperty('taxLiability');
    expect(response.body).toHaveProperty('effectiveTaxRate');
    expect(response.body).toHaveProperty('breakdown');
    expect(Array.isArray(response.body.breakdown)).toBe(true);
  });

  it('gets VAT rates for a country', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-vat-rates',
      'Tenant VAT Rates',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/reports/vat-rates')
      .set(buildAuthHeaders(tenant))
      .query({ countryCode: 'SA' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('exports VAT report to CSV', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-vat-export',
      'Tenant VAT Export',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/reports/vat/export')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        countryCode: 'SA',
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.text).toContain('VAT Report');
  });

  it('exports Zakat report to CSV', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zakat-export',
      'Tenant Zakat Export',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/reports/zakat/export')
      .set(buildAuthHeaders(tenant))
      .query({
        reportDate: '2024-01-31',
        zakatRate: 2.5,
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.text).toContain('Zakat Report');
  });

  it('performs health check', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-reports-health',
      'Tenant Reports Health',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/reports/health')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service');
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('VAT & Zakat Reports');
  });

  it('handles invalid date ranges gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-invalid-dates',
      'Tenant Invalid Dates',
    );

    const server = app.getHttpServer();

    // Test with invalid date format
    await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: 'invalid-date',
        endDate: '2024-01-31',
        countryCode: 'SA',
      })
      .expect(400);

    // Test with end date before start date
    await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-31',
        endDate: '2024-01-01',
        countryCode: 'SA',
      })
      .expect(400);
  });

  it('handles missing parameters gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-missing-params',
      'Tenant Missing Params',
    );

    const server = app.getHttpServer();

    // Test VAT report without required parameters
    await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({})
      .expect(400);

    // Test Zakat report without required parameters
    await request(server)
      .post('/api/reports/zakat')
      .set(buildAuthHeaders(tenant))
      .send({})
      .expect(400);
  });

  it('validates Zakat rate parameter', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zakat-rate',
      'Tenant Zakat Rate',
    );

    const server = app.getHttpServer();

    // Test with valid Zakat rate
    const validResponse = await request(server)
      .post('/api/reports/zakat')
      .set(buildAuthHeaders(tenant))
      .send({
        reportDate: '2024-01-31',
        zakatRate: 2.5,
      })
      .expect(201);

    expect(validResponse.body.zakatRate).toBe(2.5);

    // Test with default Zakat rate (no parameter)
    const defaultResponse = await request(server)
      .post('/api/reports/zakat')
      .set(buildAuthHeaders(tenant))
      .send({
        reportDate: '2024-01-31',
      })
      .expect(201);

    expect(defaultResponse.body.zakatRate).toBe(2.5);
  });

  it('handles different country codes', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-country-codes',
      'Tenant Country Codes',
    );

    const server = app.getHttpServer();

    // Test with Saudi Arabia
    const saResponse = await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        countryCode: 'SA',
      })
      .expect(200);

    expect(saResponse.body).toHaveProperty('period');

    // Test with UAE
    const aeResponse = await request(server)
      .get('/api/reports/vat')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        countryCode: 'AE',
      })
      .expect(200);

    expect(aeResponse.body).toHaveProperty('period');
  });
});
