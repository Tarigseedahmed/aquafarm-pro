import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Unauthorized metrics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('increments unauthorized_requests_total for missing and invalid token', async () => {
    // NOTE: We intentionally hit /api/fish-batches instead of /api/users because
    // UsersController has a PermissionsGuard at the controller level which converts
    // missing credentials into a 403 (forbidden). FishBatchesController is guarded
    // only by JwtAuthGuard so a missing or invalid token yields proper 401 responses.

    // 1. Missing token
    const missing = await request(app.getHttpServer()).get('/api/fish-batches');
    expect(missing.status).toBe(401);

    // 2. Invalid token
    const invalid = await request(app.getHttpServer())
      .get('/api/fish-batches')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(invalid.status).toBe(401);

    const metrics = await request(app.getHttpServer()).get('/api/metrics');
    expect(metrics.status).toBe(200);
    const body = metrics.text;

    const lines = body.split('\n').filter((l) => l.startsWith('unauthorized_requests_total{'));
    // Should have at least one line for /api/fish-batches (route normalized already)
    const line = lines.find((l) => l.includes('route="/api/fish-batches"'));
    expect(line).toBeTruthy();
  });
});
