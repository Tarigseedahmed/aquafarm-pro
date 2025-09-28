import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

async function registerAndLogin(app: INestApplication, email: string, role = 'user') {
  const password = 'Password123!';
  const reg = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name: 'User', role });
  expect(reg.status).toBe(201);
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  expect(login.status).toBe(201);
  return login.body.access_token as string;
}

describe('Forbidden metrics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('increments forbidden_requests_total with normalized route', async () => {
    const viewerToken = await registerAndLogin(app, 'viewer-metrics@example.com', 'viewer');

    // viewer lacks user.read so this should 403
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);

    const metrics = await request(app.getHttpServer()).get('/api/metrics');
    expect(metrics.status).toBe(200);
    const body: string = metrics.text;

    // Route should be normalized: /api/users (no dynamic segments here, but ensure presence and reason label)
    const forbiddenLine = body
      .split('\n')
      .find((l) => l.startsWith('forbidden_requests_total{') && l.includes('route="/api/users"'));
    expect(forbiddenLine).toBeTruthy();
    expect(forbiddenLine).toContain('reason="missing_permissions"');
  });
});

