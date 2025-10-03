import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1758875000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1758875000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ponds
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_ponds_tenant ON ponds (tenantId)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_ponds_tenant_farm ON ponds (tenantId, farmId)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_ponds_tenant_name ON ponds (tenantId, name)`,
    );

    // Farms
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_farms_tenant ON farms (tenantId)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_farms_tenant_owner ON farms (tenantId, ownerId)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_farms_tenant_name ON farms (tenantId, name)`,
    );

    // Water Quality Readings
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_wqr_tenant_createdAt ON water_quality_readings (tenantId, createdAt)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_wqr_tenant_pond_createdAt ON water_quality_readings (tenantId, pondId, createdAt)`,
    );

    // Fish Batches
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_fish_batches_tenant_pond ON fish_batches (tenantId, pondId)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_fish_batches_tenant_status ON fish_batches (tenantId, status)`,
    );

    // Feeding Records
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_feeding_records_tenant_batch_time ON feeding_records (tenantId, fishBatchId, feedingTime)`,
    );

    // Notifications
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_notifications_tenant_user_createdAt ON notifications (tenantId, userId, createdAt)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_notifications_tenant_user_isRead ON notifications (tenantId, userId, isRead)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Notifications
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_tenant_user_isRead`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_notifications_tenant_user_createdAt`);

    // Feeding Records
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_feeding_records_tenant_batch_time`);

    // Fish Batches
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_fish_batches_tenant_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_fish_batches_tenant_pond`);

    // Water Quality Readings
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_wqr_tenant_pond_createdAt`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_wqr_tenant_createdAt`);

    // Farms
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_farms_tenant_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_farms_tenant_owner`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_farms_tenant`);

    // Ponds
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_ponds_tenant_name`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_ponds_tenant_farm`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_ponds_tenant`);
  }
}
