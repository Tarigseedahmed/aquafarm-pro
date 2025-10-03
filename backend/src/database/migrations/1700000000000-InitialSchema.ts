import { MigrationInterface } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(): Promise<void> {
    // This is a placeholder. In a real run you would generate this automatically using TypeORM CLI.
    // Because synchronize was previously used, you should:
    // 1. Point to an EMPTY database.
    // 2. Run: npm run typeorm -- migration:generate src/database/migrations/InitialSchema
    // For now we leave empty to avoid destructive operations.
  }

  public async down(): Promise<void> {
    // Intentionally left blank (manual rollback omitted for initial baseline)
  }
}
