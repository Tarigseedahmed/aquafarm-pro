/*
  Bootstrap script: creates a default tenant (if missing) and an initial admin user.
  Usage:
    npx ts-node -r tsconfig-paths/register scripts/bootstrap.ts
  Environment vars (optional):
    DEFAULT_TENANT_CODE=default
    DEFAULT_TENANT_NAME="Default Tenant"
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=ChangeMe123!
*/
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Tenant } from '../src/tenancy/entities/tenant.entity';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const dataSource = app.get(DataSource);
  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);

  const code = (process.env.DEFAULT_TENANT_CODE || 'default').toLowerCase();
  const name = process.env.DEFAULT_TENANT_NAME || 'Default Tenant';
  let tenant = await tenantRepo.findOne({ where: { code } });
  if (!tenant) {
    tenant = tenantRepo.create({ code, name });
    tenant = await tenantRepo.save(tenant);
    console.log(`[bootstrap] Created tenant: ${code}`);
  } else {
    console.log(`[bootstrap] Tenant exists: ${code}`);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const hash = await bcrypt.hash(password, 10);
    admin = userRepo.create({
      name: 'System Admin',
      email: adminEmail,
      password: hash,
      role: 'admin',
      tenantId: tenant.id,
    });
    await userRepo.save(admin);
    console.log(`[bootstrap] Created admin user: ${adminEmail}`);
  } else {
    console.log(`[bootstrap] Admin user exists: ${adminEmail}`);
  }

  await app.close();
  console.log('[bootstrap] Done');
}

run().catch((e) => {
  console.error('[bootstrap] Failed', e);
  process.exit(1);
});
