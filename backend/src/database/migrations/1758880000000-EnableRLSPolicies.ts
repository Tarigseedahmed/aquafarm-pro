import { MigrationInterface, QueryRunner } from 'typeorm';

// Enables Row Level Security and tenant isolation policies for Postgres only.
// Policies rely on a custom GUC: app.tenant_id (text) set per request.
// Column names use camelCase (tenantId) matching TypeORM naming strategy.
export class EnableRLSPolicies1758880000000 implements MigrationInterface {
  name = 'EnableRLSPolicies1758880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return; // no-op for sqlite/tests

    const tables = [
      'tenants', // optional (read limited)
      'farms',
      'ponds',
      'water_quality_readings',
      'fish_batches',
      'feeding_records',
      'notifications',
    ];

    // Enable RLS where not already enabled & create unified policy per table.
    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      // Drop existing similarly named policy if re-running (idempotent safety during dev)
      await queryRunner.query(`DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename='${table}' AND policyname='${table}_tenant_policy') THEN
          EXECUTE 'DROP POLICY "${table}_tenant_policy" ON "${table}"';
        END IF; END $$;`);
      await queryRunner.query(`CREATE POLICY "${table}_tenant_policy" ON "${table}"
        USING (tenantId = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenantId = current_setting('app.tenant_id')::uuid);`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return; // no-op
    const tables = [
      'tenants',
      'farms',
      'ponds',
      'water_quality_readings',
      'fish_batches',
      'feeding_records',
      'notifications',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP POLICY IF EXISTS "${table}_tenant_policy" ON "${table}"`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
