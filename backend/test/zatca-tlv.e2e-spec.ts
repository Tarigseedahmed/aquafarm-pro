import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { seedTenantWithPond, buildAuthHeaders } from './utils/seeding';

/**
 * ZATCA TLV QR E2E
 * Verifies that:
 *  - TLV data generation works correctly
 *  - QR code generation is functional
 *  - Digital signature generation and verification works
 *  - Data validation is comprehensive
 */

describe('ZATCA TLV QR (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-zatca-tlv.db';
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

  it('generates ZATCA TLV QR code with signature', async () => {
    const tenant = await seedTenantWithPond(dataSource, jwtService, 'tenant-zatca', 'Tenant ZATCA');

    const invoiceData = {
      sellerName: 'Test Company Ltd',
      sellerVATNumber: '123456789012345',
      invoiceDate: '2024-01-15',
      invoiceTotal: 1000.0,
      vatTotal: 150.0,
      invoiceNumber: 'INV-2024-001',
      timestamp: '2024-01-15T10:30:00Z',
    };

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/api/zatca/generate')
      .set(buildAuthHeaders(tenant))
      .send(invoiceData)
      .expect(201);

    expect(response.body).toHaveProperty('tlvData');
    expect(response.body).toHaveProperty('qrCode');
    expect(response.body).toHaveProperty('hash');
    expect(response.body).toHaveProperty('signature');
    expect(response.body.tlvData).toContain('01'); // Tag for seller name
    expect(response.body.tlvData).toContain('02'); // Tag for VAT number
    expect(response.body.qrCode).toBeTruthy();
    expect(response.body.hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash format
    expect(response.body.signature).toBeTruthy();
  });

  it('validates invoice data correctly', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-validate',
      'Tenant ZATCA Validate',
    );

    const server = app.getHttpServer();

    // Valid data
    const validResponse = await request(server)
      .get('/api/zatca/validate')
      .set(buildAuthHeaders(tenant))
      .query({
        sellerName: 'Test Company',
        sellerVATNumber: '123456789012345',
        invoiceDate: '2024-01-15',
        invoiceTotal: 1000,
        vatTotal: 150,
        invoiceNumber: 'INV-001',
        timestamp: '2024-01-15T10:30:00Z',
      })
      .expect(200);

    expect(validResponse.body.valid).toBe(true);
    expect(validResponse.body.errors).toHaveLength(0);

    // Invalid data
    const invalidResponse = await request(server)
      .get('/api/zatca/validate')
      .set(buildAuthHeaders(tenant))
      .query({
        sellerName: '', // Invalid: empty name
        sellerVATNumber: '123', // Invalid: wrong length
        invoiceDate: 'invalid-date', // Invalid: wrong format
        invoiceTotal: -100, // Invalid: negative
        vatTotal: -50, // Invalid: negative
        invoiceNumber: '', // Invalid: empty
        timestamp: 'invalid-timestamp', // Invalid: wrong format
      })
      .expect(200);

    expect(invalidResponse.body.valid).toBe(false);
    expect(invalidResponse.body.errors.length).toBeGreaterThan(0);
  });

  it('parses TLV data back to structured format', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-parse',
      'Tenant ZATCA Parse',
    );

    // First generate TLV data
    const invoiceData = {
      sellerName: 'Parse Test Company',
      sellerVATNumber: '987654321098765',
      invoiceDate: '2024-01-20',
      invoiceTotal: 2000.0,
      vatTotal: 300.0,
      invoiceNumber: 'INV-2024-002',
      timestamp: '2024-01-20T14:45:00Z',
    };

    const server = app.getHttpServer();
    const generateResponse = await request(server)
      .post('/api/zatca/generate')
      .set(buildAuthHeaders(tenant))
      .send(invoiceData)
      .expect(201);

    // Parse the TLV data back
    const parseResponse = await request(server)
      .post('/api/zatca/parse')
      .set(buildAuthHeaders(tenant))
      .send({ tlvData: generateResponse.body.tlvData })
      .expect(201);

    expect(parseResponse.body.sellerName).toBe(invoiceData.sellerName);
    expect(parseResponse.body.sellerVATNumber).toBe(invoiceData.sellerVATNumber);
    expect(parseResponse.body.invoiceDate).toBe(invoiceData.invoiceDate);
    expect(parseResponse.body.invoiceTotal).toBe(invoiceData.invoiceTotal);
    expect(parseResponse.body.vatTotal).toBe(invoiceData.vatTotal);
    expect(parseResponse.body.invoiceNumber).toBe(invoiceData.invoiceNumber);
    expect(parseResponse.body.timestamp).toBe(invoiceData.timestamp);
  });

  it('verifies digital signature', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-verify',
      'Tenant ZATCA Verify',
    );

    const invoiceData = {
      sellerName: 'Signature Test Company',
      sellerVATNumber: '111111111111111',
      invoiceDate: '2024-01-25',
      invoiceTotal: 500.0,
      vatTotal: 75.0,
      invoiceNumber: 'INV-2024-003',
      timestamp: '2024-01-25T09:15:00Z',
    };

    const server = app.getHttpServer();

    // Generate ZATCA data
    const generateResponse = await request(server)
      .post('/api/zatca/generate')
      .set(buildAuthHeaders(tenant))
      .send(invoiceData)
      .expect(201);

    // Get test certificate
    const certResponse = await request(server)
      .get('/api/zatca/test-certificate')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    // Verify signature
    const verifyResponse = await request(server)
      .post('/api/zatca/verify')
      .set(buildAuthHeaders(tenant))
      .send({
        tlvData: generateResponse.body.tlvData,
        signature: generateResponse.body.signature,
        publicKey: certResponse.body.publicKey,
      })
      .expect(201);

    expect(verifyResponse.body.valid).toBe(true);
  });

  it('generates hash for TLV data', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-hash',
      'Tenant ZATCA Hash',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/zatca/hash')
      .set(buildAuthHeaders(tenant))
      .query({
        tlvData:
          '0104Test0201512345678901234503042024-01-1504051000.000505150.000604INV-00107042024-01-15T10:30:00Z',
      })
      .expect(200);

    expect(response.body).toHaveProperty('hash');
    expect(response.body.hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash format
  });

  it('generates QR code from TLV data', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-qr',
      'Tenant ZATCA QR',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/zatca/qr-code')
      .set(buildAuthHeaders(tenant))
      .query({
        tlvData:
          '0104Test0201512345678901234503042024-01-1504051000.000505150.000604INV-00107042024-01-15T10:30:00Z',
      })
      .expect(200);

    expect(response.body).toHaveProperty('qrCode');
    expect(response.body.qrCode).toBeTruthy();
    // QR code should be base64 encoded
    expect(() => Buffer.from(response.body.qrCode, 'base64')).not.toThrow();
  });

  it('generates test certificate for PoC', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-cert',
      'Tenant ZATCA Cert',
    );

    const server = app.getHttpServer();
    const response = await request(server)
      .get('/api/zatca/test-certificate')
      .set(buildAuthHeaders(tenant))
      .expect(200);

    expect(response.body).toHaveProperty('privateKey');
    expect(response.body).toHaveProperty('publicKey');
    expect(response.body).toHaveProperty('certificate');
    expect(response.body.privateKey).toContain('BEGIN PRIVATE KEY');
    expect(response.body.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(response.body.certificate).toContain('BEGIN CERTIFICATE');
  });

  it('handles invalid invoice data gracefully', async () => {
    const tenant = await seedTenantWithPond(
      dataSource,
      jwtService,
      'tenant-zatca-error',
      'Tenant ZATCA Error',
    );

    const server = app.getHttpServer();

    // Test with invalid data
    await request(server)
      .post('/api/zatca/generate')
      .set(buildAuthHeaders(tenant))
      .send({
        sellerName: '', // Invalid
        sellerVATNumber: '123', // Invalid
        invoiceDate: 'invalid', // Invalid
        invoiceTotal: -100, // Invalid
        vatTotal: -50, // Invalid
        invoiceNumber: '', // Invalid
        timestamp: 'invalid', // Invalid
      })
      .expect(400);
  });
});
