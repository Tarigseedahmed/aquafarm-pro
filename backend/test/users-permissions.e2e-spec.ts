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

  it('viewer cannot list or create users; editor can list/create like admin subset', async () => {
    const adminToken = await registerAndLogin(app, 'admin-users@example.com', 'admin');
    const viewerToken = await registerAndLogin(app, 'viewer-users@example.com', 'viewer');
    const editorToken = await registerAndLogin(app, 'editor-users@example.com', 'editor');

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

    // Editor can also create user
    const createByEditor = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ name: 'Ed', email: 'ed@example.com', password: 'Password123!' });
    expect(createByEditor.status).toBe(201);

    // Viewer cannot create user
    const viewerCreate = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'No', email: 'no@example.com', password: 'Password123!' });
    expect(viewerCreate.status).toBe(403);
  });

  it('non-admin user cannot update or delete another user but can update self', async () => {
    const adminToken = await registerAndLogin(app, 'admin-obj@example.com', 'admin');
    const userAToken = await registerAndLogin(app, 'user-a@example.com', 'user');
    const userBToken = await registerAndLogin(app, 'user-b@example.com', 'user');

    // Admin creates another user (C) to operate on
    const createC = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'User C', email: 'user-c@example.com', password: 'Password123!' });
    expect(createC.status).toBe(201);
    const userCId = createC.body.id;

    // Get self profile for user A to know its id
    const selfA = await request(app.getHttpServer())
      .get('/api/users/me/profile')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(selfA.status).toBe(200);
    const userAId = selfA.body.id;

    // User A updates self successfully
    const updateSelf = await request(app.getHttpServer())
      .patch(`/api/users/${userAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'User A Updated' });
    expect(updateSelf.status).toBe(200);

    // User A tries to update user C -> forbidden
    const updateOther = await request(app.getHttpServer())
      .patch(`/api/users/${userCId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Hack' });
    expect(updateOther.status).toBe(403);
    expect(updateOther.body.missing || []).toContain('ownership');

    // User B tries to delete user C -> forbidden
    const deleteOther = await request(app.getHttpServer())
      .delete(`/api/users/${userCId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(deleteOther.status).toBe(403);

    // Admin deletes user C -> allowed
    const deleteByAdmin = await request(app.getHttpServer())
      .delete(`/api/users/${userCId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteByAdmin.status).toBe(204); // DELETE now standardized to 204 No Content
  });
});

