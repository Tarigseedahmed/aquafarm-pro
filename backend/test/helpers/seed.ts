import { Repository } from 'typeorm';
import { Tenant } from '../../src/tenancy/entities/tenant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Farm } from '../../src/farms/entities/farm.entity';

export interface SeedContext {
  tenant: Tenant;
  users: User[];
  farms: Farm[];
}

export async function seedBasic(
  tenantRepo: Repository<Tenant>,
  userRepo: Repository<User>,
  farmRepo: Repository<Farm>,
  counts: { users?: number; farms?: number } = {},
): Promise<SeedContext> {
  const { users = 5, farms = 7 } = counts;

  // Ensure tenant
  const tenant = await tenantRepo.save(
    tenantRepo.create({ name: 'Test Tenant', code: `tenant_${Date.now()}`.slice(0, 20) }),
  );

  const seededUsers: User[] = [];
  for (let i = 0; i < users; i++) {
    const u = userRepo.create({
      name: `User ${i}`,
      email: `user${i}_${Date.now()}@example.com`,
      password: 'hashed',
      role: i === 0 ? 'user' : 'user',
      tenantId: tenant.id,
    });
    seededUsers.push(await userRepo.save(u));
  }

  const seededFarms: Farm[] = [];
  for (let f = 0; f < farms; f++) {
    const farm = farmRepo.create({
      name: `Farm ${f}`,
      description: 'Seed farm',
      location: 'Test Location',
      farmType: 'freshwater',
      status: 'active',
      ownerId: seededUsers[0].id,
      tenantId: tenant.id,
    });
    seededFarms.push(await farmRepo.save(farm));
  }

  return { tenant, users: seededUsers, farms: seededFarms };
}
