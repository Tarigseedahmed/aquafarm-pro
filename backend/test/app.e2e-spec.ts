import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Farm } from '../src/farms/entities/farm.entity';
import { Tenant } from '../src/tenancy/entities/tenant.entity';
import { JwtService } from '@nestjs/jwt';
import { seedBasic } from './helpers/seed';
import { bootstrapTestApp } from './bootstrap-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await bootstrapTestApp(moduleFixture);
  });

  it('/ (GET)', () => {
    return (
      request(app.getHttpServer())
        .get('/api')
        .expect(200)
        // Updated expected root message to reflect branded API banner
        .expect('AquaFarm Pro API is running! 🐟')
    );
  });

  it('/users pagination envelope & clamped page (GET)', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users } = await seedBasic(tenantRepo, userRepo, farmRepo, { users: 12, farms: 0 });
    const authUser = users[0];
    const jwt = app.get(JwtService).sign({
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
      tenantId: authUser.tenantId,
    });
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/api/users?page=99&limit=5')
      .set('Authorization', `Bearer ${jwt}`)
      .set('X-Tenant-Id', authUser.tenantId || '');
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(5);
    expect(res.body.meta.page).toBe(3);
    expect(res.body.meta.totalPages).toBe(3);
    expect(res.body.meta.total).toBe(12);
  });

  it('/farms pagination envelope (GET)', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users, tenant } = await seedBasic(tenantRepo, userRepo, farmRepo, {
      users: 3,
      farms: 11,
    });
    const jwt = app
      .get(JwtService)
      .sign({ sub: users[0].id, email: users[0].email, role: users[0].role, tenantId: tenant.id });
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/api/farms?page=2&limit=5')
      .set('Authorization', `Bearer ${jwt}`)
      .set('X-Tenant-Id', tenant.id);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.meta.limit).toBe(5);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.total).toBe(11);
    expect(res.body.meta.totalPages).toBe(3);
  });

  it('/users limit capping (GET)', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users, tenant } = await seedBasic(tenantRepo, userRepo, farmRepo, {
      users: 5,
      farms: 0,
    });
    const jwt = app
      .get(JwtService)
      .sign({ sub: users[0].id, email: users[0].email, role: users[0].role, tenantId: tenant.id });
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/api/users?limit=999&page=1')
      .set('Authorization', `Bearer ${jwt}`)
      .set('X-Tenant-Id', tenant.id);
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(100); // capped
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(5);
  });

  it('/users page normalization (GET)', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users, tenant } = await seedBasic(tenantRepo, userRepo, farmRepo, {
      users: 8,
      farms: 0,
    });
    const jwt = app
      .get(JwtService)
      .sign({ sub: users[0].id, email: users[0].email, role: users[0].role, tenantId: tenant.id });
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/api/users?page=0&limit=3')
      .set('Authorization', `Bearer ${jwt}`)
      .set('X-Tenant-Id', tenant.id);
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1); // normalized to 1
    expect(res.body.meta.limit).toBe(3);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(8);
  });

  it('/users negative page normalization (GET)', async () => {
    const userRepo = app.get(getRepositoryToken(User));
    const tenantRepo = app.get(getRepositoryToken(Tenant));
    const farmRepo = app.get(getRepositoryToken(Farm));
    const { users, tenant } = await seedBasic(tenantRepo, userRepo, farmRepo, {
      users: 6,
      farms: 0,
    });
    const jwt = app
      .get(JwtService)
      .sign({ sub: users[0].id, email: users[0].email, role: users[0].role, tenantId: tenant.id });
    const server = app.getHttpServer();
    const res = await request(server)
      .get('/api/users?page=-5&limit=4')
      .set('Authorization', `Bearer ${jwt}`)
      .set('X-Tenant-Id', tenant.id);
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1); // negative normalized to 1
    expect(res.body.meta.limit).toBe(4);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(6);
  });
});
