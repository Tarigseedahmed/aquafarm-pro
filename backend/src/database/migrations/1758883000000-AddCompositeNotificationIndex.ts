import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds composite index tailored for frequent notification queries (isRead filter + recency ordering)
export class AddCompositeNotificationIndex1758883000000 implements MigrationInterface {
  name = 'AddCompositeNotificationIndex1758883000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres supports DESC in index definition; SQLite will ignore order specifiers gracefully.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_notifications_tenant_user_isRead_createdAt ON notifications (tenantId, userId, isRead, createdAt DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_notifications_tenant_user_isRead_createdAt`,
    );
  }
}
