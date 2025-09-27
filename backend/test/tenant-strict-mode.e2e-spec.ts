import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('Tenant Strict Mode (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB = 'test-tenant-strict.db';
    process.env.MIGRATIONS_RUN = 'true';
    process.env.JWT_SECRET = 'test-secret';
    process.env.TENANT_STRICT = 'true';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('allows /health without header under strict mode', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
  });

  it('rejects protected route without header', async () => {
    const res = await request(app.getHttpServer()).get('/ponds');
    expect(res.status).toBe(400);
  });
});
