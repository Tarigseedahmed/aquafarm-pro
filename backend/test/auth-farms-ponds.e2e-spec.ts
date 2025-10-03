import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

// Helper to register & login and return token
async function registerAndLogin(
  app: INestApplication,
  email: string,
  password = 'Password123!',
  name = 'Test User',
) {
  const regRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name });
  if (regRes.status !== 201) {
    // eslint-disable-next-line no-console
    console.error('Register failed', regRes.status, regRes.body);
  }
  expect(regRes.status).toBe(201);
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  if (loginRes.status !== 201) {
    // eslint-disable-next-line no-console
    console.error('Login failed', loginRes.status, loginRes.body);
  }
  expect(loginRes.status).toBe(201);
  const token = loginRes.body.access_token;
  if (!token) {
    // eslint-disable-next-line no-console
    console.error('No token in login response', loginRes.body);
  } else if (typeof token === 'string') {
    // eslint-disable-next-line no-console
    console.log('Token snippet', token.slice(0, 25), 'parts=', token.split('.').length);
  }
  expect(typeof token).toBe('string');
  return token as string;
}

describe('Auth + Farms + Ponds multi-tenant isolation (e2e)', () => {
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

  it('should isolate farm and pond between tenants', async () => {
    // User A (creates resources under tenant 'default')
    const tokenA = await registerAndLogin(app, 'userA@example.com');

    // Create farm under tenant A
    const farmRes = await request(app.getHttpServer())
      .post('/api/farms')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', 'default')
      .send({
        name: 'Farm A1',
        location: 'Loc A',
        farmType: 'freshwater',
      });
    if (farmRes.status !== 201) {
      // Print for debugging
      // eslint-disable-next-line no-console
      console.error('Create farm failed:', farmRes.status, farmRes.body);
    }
    expect(farmRes.status).toBe(201);

    const farmId = farmRes.body.id;
    expect(farmId).toBeDefined();

    // Create pond under that farm (tenant A)
    const pondRes = await request(app.getHttpServer())
      .post('/api/ponds')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', 'default')
      .send({
        name: 'Pond A1',
        farmId,
        area: 1000,
        depth: 2,
        maxCapacity: 5000,
      })
      .expect(201);
    const pondId = pondRes.body.id;
    expect(pondId).toBeDefined();

    // Register user B after resources exist (different tenant header)
    const tokenB = await registerAndLogin(app, 'userB@example.com');

    // Negative 1: Access pond with different tenant header -> 404
    await request(app.getHttpServer())
      .get(`/api/ponds/${pondId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', 'other')
      .expect(404);

    // Negative 2: Create pond in tenant 'other' referencing farmId from 'default' -> 404 (farm not found)
    await request(app.getHttpServer())
      .post('/api/ponds')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', 'other')
      .send({
        name: 'Cross Pond',
        farmId,
        area: 10,
        depth: 1,
        maxCapacity: 100,
        volume: 10,
      })
      .expect(404);

    // Negative 3: User B tries to GET farm with other tenant -> 200 if not tenant filtered, we expect 404 once tenant scoping enforced.
    const farmOtherTenant = await request(app.getHttpServer())
      .get(`/api/farms/${farmId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', 'other');
    expect([403, 404]).toContain(farmOtherTenant.status);
  });
});
