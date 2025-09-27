import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align fish_batches.variety with entity (now nullable) and add useful index:
 * - Make variety column NULLABLE (was NOT NULL in initial schema)
 * - Add composite index for recent feeding lookups by tenant/time
 *   (tenantId, feedingTime) helps queries fetching recent feed events across batches for a tenant.
 *   If Postgres, we could add DESC ordering for covering index, but TypeORM raw SQL here keeps it simple.
 */
export class AlterFishBatchVarietyNullable1758878000000 implements MigrationInterface {
  name = 'AlterFishBatchVarietyNullable1758878000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;

    // Adjust fish_batches.variety nullability. Different SQL per driver.
    if (driver === 'postgres') {
      await queryRunner.query(`ALTER TABLE "fish_batches" ALTER COLUMN "variety" DROP NOT NULL`);
    } else if (driver === 'sqlite') {
      // SQLite requires table rebuild: create temp table with nullable column, copy data.
      await queryRunner.query(
        `CREATE TABLE "temporary_fish_batches_variety_nullable" ("id" varchar PRIMARY KEY NOT NULL, "batchNumber" varchar NOT NULL, "species" varchar NOT NULL, "variety" varchar, "initialCount" integer NOT NULL, "currentCount" integer NOT NULL, "averageWeight" decimal(8,2) NOT NULL, "totalBiomass" decimal(10,2) NOT NULL, "stockingDate" datetime NOT NULL, "expectedHarvestDate" datetime, "actualHarvestDate" datetime, "status" varchar NOT NULL DEFAULT ('active'), "survivalRate" decimal(5,2), "feedConversionRatio" decimal(8,2), "targetWeight" decimal(8,2), "supplier" varchar, "notes" varchar, "healthStatus" json, "pondId" varchar, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
      );
      await queryRunner.query(
        `INSERT INTO "temporary_fish_batches_variety_nullable" ("id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "fish_batches"`,
      );
      await queryRunner.query(`DROP TABLE "fish_batches"`);
      await queryRunner.query(
        `ALTER TABLE "temporary_fish_batches_variety_nullable" RENAME TO "fish_batches"`,
      );
    }

    // Additional helpful index for feeding records by tenant/time (skip if already similar index exists)
    // We already have IDX_feeding_records_tenant_batch_time; this new one omits batch for global recent queries.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_feeding_records_tenant_time ON feeding_records (tenantId, feedingTime)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;

    await queryRunner.query(`DROP INDEX IF EXISTS IDX_feeding_records_tenant_time`);

    if (driver === 'postgres') {
      await queryRunner.query(`ALTER TABLE "fish_batches" ALTER COLUMN "variety" SET NOT NULL`);
    } else if (driver === 'sqlite') {
      // Rebuild table with NOT NULL constraint restored
      await queryRunner.query(
        `CREATE TABLE "temporary_fish_batches_variety_notnull" ("id" varchar PRIMARY KEY NOT NULL, "batchNumber" varchar NOT NULL, "species" varchar NOT NULL, "variety" varchar NOT NULL, "initialCount" integer NOT NULL, "currentCount" integer NOT NULL, "averageWeight" decimal(8,2) NOT NULL, "totalBiomass" decimal(10,2) NOT NULL, "stockingDate" datetime NOT NULL, "expectedHarvestDate" datetime, "actualHarvestDate" datetime, "status" varchar NOT NULL DEFAULT ('active'), "survivalRate" decimal(5,2), "feedConversionRatio" decimal(8,2), "targetWeight" decimal(8,2), "supplier" varchar, "notes" varchar, "healthStatus" json, "pondId" varchar, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
      );
      // When re-inserting enforce non-null (coalesce to species if null)
      await queryRunner.query(
        `INSERT INTO "temporary_fish_batches_variety_notnull" ("id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "batchNumber", "species", COALESCE("variety", "species"), "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "fish_batches"`,
      );
      await queryRunner.query(`DROP TABLE "fish_batches"`);
      await queryRunner.query(
        `ALTER TABLE "temporary_fish_batches_variety_notnull" RENAME TO "fish_batches"`,
      );
    }
  }
}
