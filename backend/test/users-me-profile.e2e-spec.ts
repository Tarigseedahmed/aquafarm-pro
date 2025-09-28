import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

async function register(app: INestApplication, email: string, role = 'user') {
  const password = 'Password123!';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name: 'User', role })
    .expect(201);
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);
  return login.body.access_token as string;
}

describe('Users self profile (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('user role can access /users/me/profile without user.read permission', async () => {
    const token = await register(app, 'self-profile@example.com', 'user');
    const res = await request(app.getHttpServer())
      .get('/api/users/me/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'self-profile@example.com');
  });
});
