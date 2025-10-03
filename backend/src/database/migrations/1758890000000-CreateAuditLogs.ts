import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1758890000000 implements MigrationInterface {
  name = 'CreateAuditLogs1758890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver === 'sqlite') {
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" varchar PRIMARY KEY NOT NULL,
        "entity" varchar(150) NOT NULL,
        "entityId" varchar(100),
        "action" varchar(20) NOT NULL,
        "tenantId" varchar,
        "userId" varchar,
        "before" text,
        "after" text,
        "changedKeys" text,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP
      )`);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_entityId ON audit_logs(entityId)`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_tenantId ON audit_logs(tenantId)`,
      );
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_userId ON audit_logs(userId)`);
      return;
    }
    if (driver === 'postgres') {
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        entity varchar(150) NOT NULL,
        "entityId" varchar(100),
        action varchar(20) NOT NULL,
        "tenantId" uuid,
        "userId" uuid,
        before jsonb,
        after jsonb,
        "changedKeys" jsonb,
        "createdAt" timestamptz DEFAULT now()
      )`);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_entityId ON audit_logs("entityId")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_tenantId ON audit_logs("tenantId")`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_userId ON audit_logs("userId")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs');
  }
}
