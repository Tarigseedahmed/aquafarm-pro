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

describe('Users permissions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('viewer cannot list or create users; admin can', async () => {
    const adminToken = await registerAndLogin(app, 'admin-users@example.com', 'admin');
    const viewerToken = await registerAndLogin(app, 'viewer-users@example.com', 'viewer');

    // Admin can list users
    const adminList = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminList.status).toBe(200);

    // Viewer cannot list users (lacks user.read)
    const viewerList = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(viewerList.status).toBe(403);

    // Admin can create user
    const createUser = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Extra', email: 'extra@example.com', password: 'Password123!' });
    expect(createUser.status).toBe(201);

    // Viewer cannot create user
    const viewerCreate = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'No', email: 'no@example.com', password: 'Password123!' });
    expect(viewerCreate.status).toBe(403);
  });
});
