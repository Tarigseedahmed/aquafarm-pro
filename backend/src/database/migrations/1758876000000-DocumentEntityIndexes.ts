import { MigrationInterface } from 'typeorm';

// This migration is a no-op for databases that already applied AddPerformanceIndexes,
// but provides a forward-compatible placeholder if running in an environment where
// schema sync picks up newly added @Index decorators and needs a tracked migration.
export class DocumentEntityIndexes1758876000000 implements MigrationInterface {
  name = 'DocumentEntityIndexes1758876000000';

  public async up(): Promise<void> {
    // Indexes are already created in AddPerformanceIndexes migration.
    // Keeping this empty to avoid duplicate creation.
  }

  public async down(): Promise<void> {
    // Nothing to rollback since up() is a no-op.
  }
}
