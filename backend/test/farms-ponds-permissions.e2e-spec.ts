import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

async function register(app: INestApplication, email: string, role = 'user') {
  const password = 'Password123!';
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name: 'User', role });
  expect(res.status).toBe(201);
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  expect(login.status).toBe(201);
  return login.body.access_token as string;
}

describe('Farms & Ponds permissions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
  });

  afterAll(async () => {
    await app.close();
  });

  it('viewer read-only; user can create/update but not delete farms/ponds (tenant-scoped)', async () => {
    // Register a normal user (now create/update only per tightened mapping)
    const userToken = await register(app, 'crud-user@example.com', 'user');
    // Create a farm with user
    const farmRes = await request(app.getHttpServer())
      .post('/api/farms')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Farm 1', location: 'L1', farmType: 'freshwater' });
    expect(farmRes.status).toBe(201);
    const farmId = farmRes.body.id;

    // Create a pond with user
    const pondRes = await request(app.getHttpServer())
      .post('/api/ponds')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Pond 1', farmId, area: 50, depth: 2, maxCapacity: 1000 });
    expect(pondRes.status).toBe(201);
    const pondId = pondRes.body.id;

    // Register a viewer (read-only)
    const viewerToken = await register(app, 'viewer@example.com', 'viewer');

    // Viewer can read farm
    const viewerFarm = await request(app.getHttpServer())
      .get(`/api/farms/${farmId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(viewerFarm.status).toBe(200);

    // Viewer cannot update farm
    const viewerUpdateFarm = await request(app.getHttpServer())
      .patch(`/api/farms/${farmId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Nope' });
    expect(viewerUpdateFarm.status).toBe(403);

    // Viewer cannot delete farm
    const viewerDeleteFarm = await request(app.getHttpServer())
      .delete(`/api/farms/${farmId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(viewerDeleteFarm.status).toBe(403);

    // Viewer can list ponds
    const viewerPonds = await request(app.getHttpServer())
      .get('/api/ponds')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(viewerPonds.status).toBe(200);

    // Viewer cannot create pond
    const viewerCreatePond = await request(app.getHttpServer())
      .post('/api/ponds')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'X', farmId, area: 1, depth: 1, maxCapacity: 10 });
    expect(viewerCreatePond.status).toBe(403);

    // User can update pond
    const userUpdatePond = await request(app.getHttpServer())
      .patch(`/api/ponds/${pondId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Pond 1 Updated' });
    expect(userUpdatePond.status).toBe(200);

    // User cannot delete pond anymore
    const userDeletePond = await request(app.getHttpServer())
      .delete(`/api/ponds/${pondId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(userDeletePond.status).toBe(403);
  });
});
