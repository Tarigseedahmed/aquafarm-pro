import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Helper to register & login returning JWT token (user role by default)
async function registerAndLogin(app: INestApplication, email: string) {
  const password = 'Password123!';
  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name: 'Std User' });
  if (registerRes.status !== 201) {
    // eslint-disable-next-line no-console
    console.error('Register failed', registerRes.status, registerRes.body);
  }
  expect(registerRes.status).toBe(201);
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  if (loginRes.status !== 201) {
    // eslint-disable-next-line no-console
    console.error('Login failed', loginRes.status, loginRes.body);
  }
  expect(loginRes.status).toBe(201);
  return loginRes.body.access_token as string;
}

describe('Tenants permissions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should forbid non-admin user from creating/updating/deleting tenants', async () => {
    const token = await registerAndLogin(app, 'regular-user@example.com');

    // Create attempt
    const createRes = await request(app.getHttpServer())
      .post('/api/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Tenant', code: 'newtenant' });
    expect(createRes.status).toBe(403);
    expect(createRes.body.message || '').toMatch(/(Admin access required|Missing permissions)/i);

    // We need an existing tenant id to test update/delete; fetch 'me' to get current tenant
    const meRes = await request(app.getHttpServer())
      .get('/api/tenants/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    const tenantId = meRes.body?.id;
    expect(tenantId).toBeDefined();

    // Update attempt
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed' });
    expect(updateRes.status).toBe(403);
    expect(updateRes.body.message || '').toMatch(/(Admin access required|Missing permissions)/i);

    // Delete attempt
    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.message || '').toMatch(/(Admin access required|Missing permissions)/i);
  });
});
