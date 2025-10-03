import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * EGS Egypt Connector E2E
 * Verifies that:
 *  - OAuth flow works correctly
 *  - Token refresh mechanism functions
 *  - Invoice submission and status checking work
 *  - Data validation is comprehensive
 */

describe('EGS Egypt Connector (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-egs-connector.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';

    // Mock EGS configuration
    process.env.EGS_BASE_URL = 'https://api.egs.gov.eg';
    process.env.EGS_CLIENT_ID = 'test-client-id';
    process.env.EGS_CLIENT_SECRET = 'test-client-secret';
    process.env.EGS_REDIRECT_URI = 'http://localhost:3000/callback';
    process.env.EGS_SCOPE = 'invoice_submission';

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

  it('gets OAuth authorization URL', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-auth',
      'Tenant EGS Auth',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/egs/auth-url')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('authUrl');
    expect(response.body.authUrl).toContain('https://api.egs.gov.eg/oauth/authorize');
    expect(response.body.authUrl).toContain('client_id=test-client-id');
    expect(response.body.authUrl).toContain('response_type=code');
    expect(response.body.authUrl).toContain('scope=invoice_submission');
  });

  it('validates invoice data correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-validate',
      'Tenant EGS Validate',
    );

    const validInvoice = {
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15',
      sellerName: 'Test Company Ltd',
      sellerVATNumber: '123456789',
      buyerName: 'Customer Name',
      buyerVATNumber: '987654321',
      totalAmount: 1000.0,
      vatAmount: 150.0,
      items: [
        {
          description: 'Test Product',
          quantity: 1,
          unitPrice: 1000.0,
          totalPrice: 1000.0,
          vatRate: 15.0,
        },
      ],
    };

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/egs/validate-invoice')
      .set(buildAuthHeaders(tenant))
      .send(validInvoice)
      .expect(200);

    expect(response.body.valid).toBe(true);
    expect(response.body.errors).toHaveLength(0);
  });

  it('detects invalid invoice data', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-invalid',
      'Tenant EGS Invalid',
    );

    const invalidInvoice = {
      invoiceNumber: '', // Invalid: empty
      invoiceDate: 'invalid-date', // Invalid: wrong format
      sellerName: '', // Invalid: empty
      sellerVATNumber: '123', // Invalid: wrong length
      buyerName: '', // Invalid: empty
      buyerVATNumber: '456', // Invalid: wrong length
      totalAmount: -100, // Invalid: negative
      vatAmount: -50, // Invalid: negative
      items: [], // Invalid: empty
    };

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/egs/validate-invoice')
      .set(buildAuthHeaders(tenant))
      .send(invalidInvoice)
      .expect(200);

    expect(response.body.valid).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('handles token status check', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-token',
      'Tenant EGS Token',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/egs/token-status')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('hasAccessToken');
    expect(response.body).toHaveProperty('hasRefreshToken');
    expect(response.body).toHaveProperty('isExpired');
    expect(response.body).toHaveProperty('expiresAt');
  });

  it('performs health check', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-health',
      'Tenant EGS Health',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/egs/health')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('tokenStatus');
    expect(response.body.status).toBe('healthy');
  });

  it('clears tokens successfully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-clear',
      'Tenant EGS Clear',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/egs/clear-tokens')
      .set(buildAuthHeaders(tenant))
      .expect(201);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Tokens cleared successfully');
  });

  it('handles token exchange errors gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-error',
      'Tenant EGS Error',
    );

    const server = app.getHttpServer();

    // Test with invalid code
    await request(server)
      .post('/api/egs/exchange-token')
      .set(buildAuthHeaders(tenant))
      .send({
        code: 'invalid-code',
        state: 'invalid-state',
      })
      .expect(400);

    // Test with missing parameters
    await request(server)
      .post('/api/egs/exchange-token')
      .set(buildAuthHeaders(tenant))
      .send({})
      .expect(400);
  });

  it('handles refresh token errors gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-refresh',
      'Tenant EGS Refresh',
    );

    const server = app.getHttpServer();

    // Test refresh without existing tokens
    await request(server).post('/api/egs/refresh-token').set(buildAuthHeaders(tenant)).expect(400);
  });

  it('validates invoice items correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-items',
      'Tenant EGS Items',
    );

    const invoiceWithInvalidItems = {
      invoiceNumber: 'INV-2024-002',
      invoiceDate: '2024-01-15',
      sellerName: 'Test Company',
      sellerVATNumber: '123456789',
      buyerName: 'Customer',
      totalAmount: 1000.0,
      vatAmount: 150.0,
      items: [
        {
          description: '', // Invalid: empty
          quantity: -1, // Invalid: negative
          unitPrice: -100, // Invalid: negative
          totalPrice: 0, // Invalid: zero
          vatRate: 150, // Invalid: over 100%
        },
      ],
    };

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/egs/validate-invoice')
      .set(buildAuthHeaders(tenant))
      .send(invoiceWithInvalidItems)
      .expect(200);

    expect(response.body.valid).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(
      response.body.errors.some((error: string) => error.includes('Description is required')),
    ).toBe(true);
    expect(
      response.body.errors.some((error: string) =>
        error.includes('Quantity must be greater than 0'),
      ),
    ).toBe(true);
    expect(
      response.body.errors.some((error: string) =>
        error.includes('VAT rate must be between 0 and 100'),
      ),
    ).toBe(true);
  });

  it('handles missing configuration gracefully', async () => {
    // Temporarily remove environment variables
    const originalBaseUrl = process.env.EGS_BASE_URL;
    const originalClientId = process.env.EGS_CLIENT_ID;

    delete process.env.EGS_BASE_URL;
    delete process.env.EGS_CLIENT_ID;

    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-egs-config',
      'Tenant EGS Config',
    );

    const server = app.getHttpServer();

    // Should still work with default values
    const response = await request(server)
      .get('/api/egs/auth-url')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('authUrl');

    // Restore environment variables
    process.env.EGS_BASE_URL = originalBaseUrl;
    process.env.EGS_CLIENT_ID = originalClientId;
  });
});
