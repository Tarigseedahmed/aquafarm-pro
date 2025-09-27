import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { bootstrapTestApp } from './bootstrap-test-app';

/**
 * Verifies that the Swagger document includes the global X-Tenant-Id header parameter
 * injected programmatically in main.ts and that at least one path operation references it.
 */
describe('Swagger Global Tenant Header (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await bootstrapTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should expose /docs-json with components.parameters.XTenantIdHeader', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const doc = res.body;
    expect(doc.components).toBeDefined();
    expect(doc.components.parameters).toBeDefined();
    expect(doc.components.parameters.XTenantIdHeader).toBeDefined();
    const samplePathKey = Object.keys(doc.paths)[0];
    const sampleOpKey = Object.keys(doc.paths[samplePathKey])[0];
    const params = doc.paths[samplePathKey][sampleOpKey].parameters || [];
    const found = params.some(
      (p: any) => p.$ref?.includes('XTenantIdHeader') || p.name === 'X-Tenant-Id',
    );
    expect(found).toBe(true);
  });
});
