import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

async function register(app: INestApplication, email: string) {
  const password = 'Password123!';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name: 'User' });
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return login.body.access_token as string;
}

describe('Farm stats tenant isolation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not allow stats leakage across tenants', async () => {
    const tokenA = await register(app, 'fa@example.com');
    const farmRes = await request(app.getHttpServer())
      .post('/api/farms')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', 'default')
      .send({ name: 'Farm X', location: 'L', farmType: 'freshwater' })
      .expect(201);
    const farmId = farmRes.body.id;

    const tokenB = await register(app, 'fb@example.com');

    // Stats with wrong tenant header should 404
    await request(app.getHttpServer())
      .get(`/api/farms/${farmId}/stats`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', 'other')
      .expect(404);
  });
});
