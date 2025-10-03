import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantIdNotNullAndUnique1758890000000 implements MigrationInterface {
  name = 'TenantIdNotNullAndUnique1758890000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make tenantId NOT NULL where feasible and add composite uniques
    // Farms
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "farms"
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    // Ponds
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "ponds"
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    // Fish batches
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "fish_batches"
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    // Feeding records
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "feeding_records"
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);
    // Water quality readings
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "water_quality_readings"
      ALTER COLUMN "tenantId" SET NOT NULL;
    `);

    // Add composite uniques (idempotent guards via IF NOT EXISTS not supported pre-psql 15; use try-create)
    try { await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_farms_tenant_name" ON "farms" ("tenantId", "name");`);} catch {}
    try { await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ponds_tenant_name" ON "ponds" ("tenantId", "name");`);} catch {}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse NOT NULL (make nullable)
    await queryRunner.query(`ALTER TABLE IF EXISTS "water_quality_readings" ALTER COLUMN "tenantId" DROP NOT NULL;`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "feeding_records" ALTER COLUMN "tenantId" DROP NOT NULL;`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "fish_batches" ALTER COLUMN "tenantId" DROP NOT NULL;`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "ponds" ALTER COLUMN "tenantId" DROP NOT NULL;`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "farms" ALTER COLUMN "tenantId" DROP NOT NULL;`);
    // Optionally drop indexes
    try { await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ponds_tenant_name";`);} catch {}
    try { await queryRunner.query(`DROP INDEX IF EXISTS "UQ_farms_tenant_name";`);} catch {}
  }
}


