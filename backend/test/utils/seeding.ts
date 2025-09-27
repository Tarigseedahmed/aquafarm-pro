import { DataSource } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from '../../src/tenancy/entities/tenant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Farm } from '../../src/farms/entities/farm.entity';
import { Pond } from '../../src/ponds/entities/pond.entity';

export interface SeedBasic {
  tenantId: string;
  userId: string;
  farmId: string;
  token: string;
}

export interface SeedWithPond extends SeedBasic {
  pondId: string;
}

/** Ensure a tenant exists (by unique code) */
async function ensureTenant(ds: DataSource, code: string, name: string) {
  const repo = ds.getRepository(Tenant);
  let t = await repo.findOne({ where: { code } });
  if (!t) {
    t = repo.create({ code, name });
    t = await repo.save(t);
  }
  return t;
}

/** Ensure a user exists for provided tenant code (email derived from code) */
async function ensureUser(ds: DataSource, tenantId: string, code: string, name: string) {
  const repo = ds.getRepository(User);
  const email = `${code}@test.local`;
  let u = await repo.findOne({ where: { email } });
  if (!u) {
    u = repo.create({
      id: uuid(),
      name: `${name} User`,
      email,
      password: 'hashed',
      role: 'user',
      tenantId,
    });
    u = await repo.save(u);
  } else if (!u.tenantId) {
    u.tenantId = tenantId;
    await repo.save(u);
  }
  return u;
}

/** Ensure a farm exists for a tenant */
async function ensureFarm(ds: DataSource, tenantId: string, name: string, ownerId: string) {
  const repo = ds.getRepository(Farm);
  let f = await repo.findOne({ where: { name: `${name} Farm`, tenantId } });
  if (!f) {
    f = repo.create({
      id: uuid(),
      name: `${name} Farm`,
      location: 'Nowhere',
      farmType: 'freshwater',
      status: 'active',
      ownerId,
      tenantId,
    });
    f = await repo.save(f);
  }
  return f;
}

/** Ensure a pond exists for a tenant's farm */
async function ensurePond(
  ds: DataSource,
  tenantId: string,
  name: string,
  farmId: string,
  managedById: string,
) {
  const repo = ds.getRepository(Pond);
  let p = await repo.findOne({ where: { name: `${name} Pond 1`, tenantId } });
  if (!p) {
    p = repo.create({
      id: uuid(),
      name: `${name} Pond 1`,
      area: 100,
      depth: 2,
      volume: 200,
      maxCapacity: 500,
      farmId,
      managedById,
      tenantId,
      status: 'active',
      shape: 'rectangular',
      currentStockCount: 0,
    });
    p = await repo.save(p);
  }
  return p;
}

/**
 * Seeds tenant + user + farm hierarchy (no pond) and returns auth token.
 */
export async function seedTenantFarmUser(
  ds: DataSource,
  jwt: JwtService,
  code: string,
  name: string,
): Promise<SeedBasic> {
  const tenant = await ensureTenant(ds, code, name);
  const user = await ensureUser(ds, tenant.id, code, name);
  const farm = await ensureFarm(ds, tenant.id, name, user.id);
  const payload = { sub: user.id, email: user.email, role: user.role, tenantId: tenant.id };
  const token = await jwt.signAsync(payload, { secret: process.env.JWT_SECRET || 'test-secret' });
  return { tenantId: tenant.id, userId: user.id, farmId: farm.id, token };
}

/**
 * Seeds tenant + user + farm + pond hierarchy.
 */
export async function seedTenantWithPond(
  ds: DataSource,
  jwt: JwtService,
  code: string,
  name: string,
): Promise<SeedWithPond> {
  const base = await seedTenantFarmUser(ds, jwt, code, name);
  const pond = await ensurePond(ds, base.tenantId, name, base.farmId, base.userId);
  return { ...base, pondId: pond.id };
}

/**
 * Builds standard auth headers for a seeded tenant record.
 */
export function buildAuthHeaders(record: SeedBasic | SeedWithPond) {
  return {
    'X-Tenant-Id': record.tenantId,
    Authorization: `Bearer ${record.token}`,
  };
}
