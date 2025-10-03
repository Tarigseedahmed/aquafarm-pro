import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToUsersAndRLS1758881000000 implements MigrationInterface {
  name = 'AddTenantToUsersAndRLS1758881000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver === 'sqlite') {
      // Check if column already exists
      const columns: Array<{ name: string }> = await queryRunner.query(
        `PRAGMA table_info('users')`,
      );
      const exists = columns.some((c) => c.name === 'tenantId');
      if (!exists) {
        // SQLite: uuid type fallback to TEXT
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "tenantId" varchar`);
      }
      // SQLite does not support CREATE INDEX IF NOT EXISTS before 3.8.0 but safe to run; ignore errors.
      try {
        await queryRunner.query(
          `CREATE INDEX "idx_users_tenant_email" ON "users" ("tenantId", "email")`,
        );
      } catch {
        // ignore if exists
      }
      return; // RLS not applicable
    }
    // Postgres path
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenantId" uuid`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_tenant_email" ON "users" ("tenantId", "email")`,
    );
    if (driver === 'postgres') {
      await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename='users' AND policyname='users_tenant_policy') THEN
          EXECUTE 'DROP POLICY "users_tenant_policy" ON "users"';
        END IF; END $$;`);
      await queryRunner.query(`CREATE POLICY "users_tenant_policy" ON "users"
        USING (tenantId = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenantId = current_setting('app.tenant_id')::uuid);`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type === 'postgres') {
      await queryRunner.query(`DROP POLICY IF EXISTS "users_tenant_policy" ON "users"`);
      await queryRunner.query(`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY`);
    }
    // Column retained intentionally (non-destructive rollback).
  }
}
