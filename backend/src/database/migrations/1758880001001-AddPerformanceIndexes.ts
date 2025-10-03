import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1758880001001 implements MigrationInterface {
  name = 'AddPerformanceIndexes1758880001001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes for frequently queried columns
    
    // Users table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_tenant_id" ON "users" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role" ON "users" ("role")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("createdAt")
    `);

    // Farms table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_farms_tenant_id" ON "farms" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_farms_status" ON "farms" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_farms_created_at" ON "farms" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_farms_name" ON "farms" ("name")
    `);

    // Ponds table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ponds_farm_id" ON "ponds" ("farmId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ponds_status" ON "ponds" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ponds_created_at" ON "ponds" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ponds_capacity" ON "ponds" ("capacity")
    `);

    // Water quality readings indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_pond_id" ON "water_quality_readings" ("pondId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_reading_date" ON "water_quality_readings" ("readingDate")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_created_at" ON "water_quality_readings" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_temperature" ON "water_quality_readings" ("temperature")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_ph" ON "water_quality_readings" ("ph")
    `);

    // Fish batches indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_pond_id" ON "fish_batches" ("pondId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_status" ON "fish_batches" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_stocking_date" ON "fish_batches" ("stockingDate")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_created_at" ON "fish_batches" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_species" ON "fish_batches" ("species")
    `);

    // Feeding records indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feeding_records_batch_id" ON "feeding_records" ("batchId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feeding_records_feeding_date" ON "feeding_records" ("feedingDate")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feeding_records_created_at" ON "feeding_records" ("createdAt")
    `);

    // Notifications indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id" ON "notifications" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_type" ON "notifications" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_read" ON "notifications" ("read")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_created_at" ON "notifications" ("createdAt")
    `);

    // Tenants indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenants_code" ON "tenants" ("code")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tenants_status" ON "tenants" ("status")
    `);

    // Fx rates indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fx_rates_currency_pair" ON "fx_rates" ("currencyPair")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fx_rates_date" ON "fx_rates" ("date")
    `);

    // Audit logs indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity_type" ON "audit_logs" ("entityType")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity_id" ON "audit_logs" ("entityId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON "audit_logs" ("action")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_user_id" ON "audit_logs" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at" ON "audit_logs" ("createdAt")
    `);

    // Composite indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_pond_date" ON "water_quality_readings" ("pondId", "readingDate")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_pond_status" ON "fish_batches" ("pondId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feeding_records_batch_date" ON "feeding_records" ("batchId", "feedingDate")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("userId", "read")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity_type_id" ON "audit_logs" ("entityType", "entityId")
    `);

    // Partial indexes for better performance on filtered queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_water_quality_active_readings" 
      ON "water_quality_readings" ("readingDate") 
      WHERE "readingDate" >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fish_batches_active_batches" 
      ON "fish_batches" ("status", "stockingDate") 
      WHERE "status" IN ('active', 'growing')
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_unread" 
      ON "notifications" ("userId", "createdAt") 
      WHERE "read" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes created in up method
    const indexes = [
      'IDX_users_email',
      'IDX_users_tenant_id',
      'IDX_users_role',
      'IDX_users_created_at',
      'IDX_farms_tenant_id',
      'IDX_farms_status',
      'IDX_farms_created_at',
      'IDX_farms_name',
      'IDX_ponds_farm_id',
      'IDX_ponds_status',
      'IDX_ponds_created_at',
      'IDX_ponds_capacity',
      'IDX_water_quality_pond_id',
      'IDX_water_quality_reading_date',
      'IDX_water_quality_created_at',
      'IDX_water_quality_temperature',
      'IDX_water_quality_ph',
      'IDX_fish_batches_pond_id',
      'IDX_fish_batches_status',
      'IDX_fish_batches_stocking_date',
      'IDX_fish_batches_created_at',
      'IDX_fish_batches_species',
      'IDX_feeding_records_batch_id',
      'IDX_feeding_records_feeding_date',
      'IDX_feeding_records_created_at',
      'IDX_notifications_user_id',
      'IDX_notifications_type',
      'IDX_notifications_read',
      'IDX_notifications_created_at',
      'IDX_tenants_code',
      'IDX_tenants_status',
      'IDX_fx_rates_currency_pair',
      'IDX_fx_rates_date',
      'IDX_audit_logs_entity_type',
      'IDX_audit_logs_entity_id',
      'IDX_audit_logs_action',
      'IDX_audit_logs_user_id',
      'IDX_audit_logs_created_at',
      'IDX_water_quality_pond_date',
      'IDX_fish_batches_pond_status',
      'IDX_feeding_records_batch_date',
      'IDX_notifications_user_read',
      'IDX_audit_logs_entity_type_id',
      'IDX_water_quality_active_readings',
      'IDX_fish_batches_active_batches',
      'IDX_notifications_unread',
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}"`);
    }
  }
}
