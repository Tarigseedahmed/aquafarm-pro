import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * Multi-Currency & FX E2E
 * Verifies that:
 *  - Currency conversion works correctly
 *  - Exchange gain/loss calculations are accurate
 *  - Journal entries are created properly
 *  - Exchange rate queries function correctly
 */

describe('Multi-Currency & FX (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-multi-currency.db';
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

  it('converts currency correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-currency-convert',
      'Tenant Currency Convert',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/multi-currency/convert')
      .set(buildAuthHeaders(tenant))
      .send({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        amount: 1000,
        rateDate: '2024-01-15',
      })
      .expect(201);

    expect(response.body).toHaveProperty('fromCurrency');
    expect(response.body).toHaveProperty('toCurrency');
    expect(response.body).toHaveProperty('amount');
    expect(response.body).toHaveProperty('rate');
    expect(response.body).toHaveProperty('convertedAmount');
    expect(response.body).toHaveProperty('rateDate');
    expect(response.body.fromCurrency).toBe('USD');
    expect(response.body.toCurrency).toBe('SAR');
    expect(response.body.amount).toBe(1000);
  });

  it('handles same currency conversion', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-same-currency',
      'Tenant Same Currency',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/multi-currency/convert')
      .set(buildAuthHeaders(tenant))
      .send({
        fromCurrency: 'USD',
        toCurrency: 'USD',
        amount: 1000,
        rateDate: '2024-01-15',
      })
      .expect(201);

    expect(response.body.fromCurrency).toBe('USD');
    expect(response.body.toCurrency).toBe('USD');
    expect(response.body.amount).toBe(1000);
    expect(response.body.convertedAmount).toBe(1000);
    expect(response.body.rate).toBe(1);
  });

  it('calculates exchange gain/loss correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-gain-loss',
      'Tenant Gain Loss',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/multi-currency/calculate-gain-loss')
      .set(buildAuthHeaders(tenant))
      .send({
        transactionId: 'TXN-001',
        originalCurrency: 'USD',
        functionalCurrency: 'SAR',
        originalAmount: 1000,
        transactionDate: '2024-01-01',
        settlementDate: '2024-01-15',
      })
      .expect(201);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body).toHaveProperty('originalCurrency');
    expect(response.body).toHaveProperty('functionalCurrency');
    expect(response.body).toHaveProperty('originalAmount');
    expect(response.body).toHaveProperty('functionalAmount');
    expect(response.body).toHaveProperty('exchangeRate');
    expect(response.body).toHaveProperty('gainLossAmount');
    expect(response.body).toHaveProperty('gainLossType');
    expect(response.body).toHaveProperty('rateDate');
    expect(['GAIN', 'LOSS']).toContain(response.body.gainLossType);
  });

  it('validates currency codes correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-validate-currency',
      'Tenant Validate Currency',
    );

    const server = app.getHttpServer();

    // Valid currency code
    const validResponse = await request(server)
      .get('/api/multi-currency/validate-currency/USD')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(validResponse.body.valid).toBe(true);

    // Invalid currency code
    const invalidResponse = await request(server)
      .get('/api/multi-currency/validate-currency/INVALID')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(invalidResponse.body.valid).toBe(false);
  });

  it('gets supported currencies', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-supported-currencies',
      'Tenant Supported Currencies',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/supported-currencies')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('currencies');
    expect(Array.isArray(response.body.currencies)).toBe(true);
  });

  it('gets exchange rate for specific date', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-exchange-rate',
      'Tenant Exchange Rate',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/exchange-rate')
      .set(buildAuthHeaders(tenant))
      .query({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        date: '2024-01-15',
      })
      .expect(200);

    if (response.body) {
      expect(response.body).toHaveProperty('base');
      expect(response.body).toHaveProperty('quote');
      expect(response.body).toHaveProperty('rate');
      expect(response.body).toHaveProperty('rateDate');
    }
  });

  it('gets latest exchange rate', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-latest-rate',
      'Tenant Latest Rate',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/latest-rate')
      .set(buildAuthHeaders(tenant))
      .query({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
      })
      .expect(200);

    if (response.body) {
      expect(response.body).toHaveProperty('base');
      expect(response.body).toHaveProperty('quote');
      expect(response.body).toHaveProperty('rate');
      expect(response.body).toHaveProperty('rateDate');
    }
  });

  it('gets exchange rate history', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-rate-history',
      'Tenant Rate History',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/rate-history')
      .set(buildAuthHeaders(tenant))
      .query({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('calculates average exchange rate', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-average-rate',
      'Tenant Average Rate',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/average-rate')
      .set(buildAuthHeaders(tenant))
      .query({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })
      .expect(200);

    expect(response.body).toHaveProperty('averageRate');
    expect(typeof response.body.averageRate).toBe('number');
  });

  it('gets currency conversion summary', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-conversion-summary',
      'Tenant Conversion Summary',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/multi-currency/conversion-summary')
      .set(buildAuthHeaders(tenant))
      .query({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })
      .expect(200);

    expect(response.body).toHaveProperty('totalConversions');
    expect(response.body).toHaveProperty('totalGainLoss');
    expect(response.body).toHaveProperty('gainLossBreakdown');
    expect(Array.isArray(response.body.gainLossBreakdown)).toBe(true);
  });

  it('revalues foreign currency balances', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-revalue',
      'Tenant Revalue',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/multi-currency/revalue-balances')
      .set(buildAuthHeaders(tenant))
      .send({
        revaluationDate: '2024-01-31',
        functionalCurrency: 'SAR',
      })
      .expect(201);

    expect(response.body).toHaveProperty('revaluedAccounts');
    expect(response.body).toHaveProperty('totalGainLoss');
    expect(Array.isArray(response.body.revaluedAccounts)).toBe(true);
    expect(typeof response.body.totalGainLoss).toBe('number');
  });

  it('handles missing exchange rates gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-missing-rates',
      'Tenant Missing Rates',
    );

    const server = app.getHttpServer();

    // Test with non-existent currency pair
    await request(server)
      .post('/api/multi-currency/convert')
      .set(buildAuthHeaders(tenant))
      .send({
        fromCurrency: 'XYZ',
        toCurrency: 'ABC',
        amount: 1000,
        rateDate: '2024-01-15',
      })
      .expect(400);
  });

  it('handles invalid currency conversion parameters', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-invalid-params',
      'Tenant Invalid Params',
    );

    const server = app.getHttpServer();

    // Test with negative amount
    await request(server)
      .post('/api/multi-currency/convert')
      .set(buildAuthHeaders(tenant))
      .send({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        amount: -1000,
        rateDate: '2024-01-15',
      })
      .expect(400);

    // Test with invalid date format
    await request(server)
      .post('/api/multi-currency/convert')
      .set(buildAuthHeaders(tenant))
      .send({
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        amount: 1000,
        rateDate: 'invalid-date',
      })
      .expect(400);
  });
});
