import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Postgres-only performance indexes (partial + BRIN) to optimize common multi-tenant queries:
 * 1. Unread notifications count (small selective partial index)
 * 2. Time-series querying over large water quality readings (BRIN for append-only style growth)
 * 3. Optional BRIN for feeding records (reporting / analytics)
 */
export class PostgresPartialIndexes1758877000000 implements MigrationInterface {
  name = 'PostgresPartialIndexes1758877000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver !== 'postgres') {
      return; // Skip for SQLite / other drivers
    }

    // Unread notifications (filters out read rows, keeps index small & hot)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_unread" ON "notifications" ("tenantId", "userId") WHERE "isRead" = false`,
    );

    // BRIN indexes are efficient for large append-only tables ordered by createdAt
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wqr_tenant_createdAt_brin" ON "water_quality_readings" USING BRIN ("tenantId", "createdAt")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feeding_records_tenant_createdAt_brin" ON "feeding_records" USING BRIN ("tenantId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver !== 'postgres') {
      return;
    }

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_feeding_records_tenant_createdAt_brin"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_wqr_tenant_createdAt_brin"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_unread"');
  }
}
