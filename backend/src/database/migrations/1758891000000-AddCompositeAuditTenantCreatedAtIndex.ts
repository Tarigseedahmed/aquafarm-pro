import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeAuditTenantCreatedAtIndex1758891000000 implements MigrationInterface {
  name = 'AddCompositeAuditTenantCreatedAtIndex1758891000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver === 'sqlite') {
      await queryRunner.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_tenant_createdAt ON audit_logs(tenantId, createdAt)'
      );
      return;
    }
    if (driver === 'postgres') {
      await queryRunner.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_tenant_createdAt ON audit_logs("tenantId", "createdAt")'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver === 'sqlite') {
      await queryRunner.query('DROP INDEX IF EXISTS idx_audit_tenant_createdAt');
      return;
    }
    if (driver === 'postgres') {
      await queryRunner.query('DROP INDEX IF EXISTS idx_audit_tenant_createdAt');
    }
  }
}
