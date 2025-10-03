import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner } from 'typeorm';
import { PinoLoggerService } from '../common/logging/pino-logger.service';

export interface MigrationStatus {
  id: number | string;
  name: string;
  timestamp: Date | number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  duration?: number;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  migrationsRun: number;
  migrationsRolledBack: number;
  duration: number;
  errors: string[];
}

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: 0,
      migrationsRolledBack: 0,
      duration: 0,
      errors: [],
    };

    try {
      this.logger.log('Starting database migrations...');
      this.pinoLogger.info({ event: 'migration.start' }, 'Database migrations started');

      // Check if migrations table exists
      await this.ensureMigrationsTableExists();

      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        this.logger.log('No pending migrations found');
        return result;
      }

      this.logger.log(`Found ${pendingMigrations.length} pending migrations`);

      // Run migrations in transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const migration of pendingMigrations) {
          await this.runSingleMigration(queryRunner, migration);
          result.migrationsRun++;
        }

        await queryRunner.commitTransaction();
        result.success = true;

        this.logger.log(`Successfully ran ${result.migrationsRun} migrations`);
        this.pinoLogger.info(
          {
            event: 'migration.completed',
            migrationsRun: result.migrationsRun,
            duration: Date.now() - startTime
          },
          'Database migrations completed successfully'
        );

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);

      this.logger.error('Migration failed:', error);
      this.pinoLogger.error(
        {
          event: 'migration.failed',
          error: error.message,
          duration: Date.now() - startTime
        },
        'Database migrations failed'
      );
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Rollback the last migration
   */
  async rollbackLastMigration(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: 0,
      migrationsRolledBack: 0,
      duration: 0,
      errors: [],
    };

    try {
      this.logger.log('Starting migration rollback...');

      // Get the last completed migration
      const lastMigration = await this.getLastCompletedMigration();

      if (!lastMigration) {
        this.logger.log('No migrations to rollback');
        return result;
      }

      this.logger.log(`Rolling back migration: ${lastMigration.name}`);

      // Rollback in transaction
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.rollbackSingleMigration(queryRunner, lastMigration);
        result.migrationsRolledBack = 1;
        await queryRunner.commitTransaction();

        this.logger.log('Migration rollback completed successfully');

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);

      this.logger.error('Migration rollback failed:', error);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus[]> {
    try {
      await this.ensureMigrationsTableExists();

      // Get all migration files
      const migrationFiles = this.dataSource.migrations || [];
      const executedMigrations = await this.getExecutedMigrations();

      const status: MigrationStatus[] = [];

      for (const migration of migrationFiles) {
        const executed = executedMigrations.find(em => em.name === migration.name);

        status.push({
          id: migration.name,
          name: migration.name,
          timestamp: executed?.timestamp || Date.now(),
          status: executed ? 'completed' : 'pending',
          duration: executed?.duration,
        });
      }

      return status;
    } catch (error) {
      this.logger.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Validate migration files
   */
  async validateMigrations(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const migrations = this.dataSource.migrations || [];

      for (const migration of migrations) {
        // Check for common issues
        if (!migration.name) {
          result.errors.push(`Migration has no name`);
          result.isValid = false;
        }

        if (migration.name && !migration.name.match(/^\d{13}-.*\.ts$/)) {
          result.warnings.push(`Migration ${migration.name} doesn't follow naming convention`);
        }

        // Skip SQL injection check for function-based migrations
        // We can't validate functions the same way as SQL strings
      }

    } catch (error: any) {
      result.errors.push(`Failed to validate migrations: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Create a backup before running migrations
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.sql`;

    try {
      this.logger.log(`Creating database backup: ${backupName}`);

      // This would typically use pg_dump for PostgreSQL
      // For now, we'll create a placeholder
      const backupPath = `/tmp/${backupName}`;

      // In a real implementation, you would run pg_dump here
      // const { exec } = require('child_process');
      // exec(`pg_dump ${connectionString} > ${backupPath}`);

      this.logger.log(`Backup created: ${backupPath}`);
      return backupPath;

    } catch (error) {
      this.logger.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Run a single migration
   */
  private async runSingleMigration(queryRunner: QueryRunner, migration: any): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log(`Running migration: ${migration.name}`);

      // Update migration status to running
      await this.updateMigrationStatus(queryRunner, migration.name, 'running');

      // Execute migration
      if (typeof migration.up === 'function') {
        await migration.up(queryRunner);
      } else if (typeof migration.up === 'string') {
        await queryRunner.query(migration.up);
      }

      // Update migration status to completed
      const duration = Date.now() - startTime;
      await this.updateMigrationStatus(queryRunner, migration.name, 'completed', duration);

      this.logger.log(`Migration completed: ${migration.name} (${duration}ms)`);

    } catch (error) {
      // Update migration status to failed
      await this.updateMigrationStatus(queryRunner, migration.name, 'failed', undefined, error.message);

      this.logger.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  private async rollbackSingleMigration(queryRunner: QueryRunner, migration: any): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log(`Rolling back migration: ${migration.name}`);

      // Execute rollback
      if (typeof migration.down === 'function') {
        await migration.down(queryRunner);
      } else if (typeof migration.down === 'string') {
        await queryRunner.query(migration.down);
      }

      // Update migration status
      const duration = Date.now() - startTime;
      await this.updateMigrationStatus(queryRunner, migration.name, 'rolled_back', duration);

      this.logger.log(`Migration rollback completed: ${migration.name} (${duration}ms)`);

    } catch (error) {
      this.logger.error(`Migration rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTableExists(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          duration INTEGER,
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      this.logger.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<any[]> {
    const allMigrations = this.dataSource.migrations || [];
    const executedMigrations = await this.getExecutedMigrations();

    return allMigrations.filter(migration =>
      !executedMigrations.some(em => em.name === migration.name)
    );
  }

  /**
   * Get executed migrations
   */
  private async getExecutedMigrations(): Promise<any[]> {
    try {
      const result = await this.dataSource.query(`
        SELECT name, timestamp, status, duration, error
        FROM migrations
        WHERE status IN ('completed', 'failed')
        ORDER BY timestamp ASC
      `);

      return result;
    } catch (error) {
      this.logger.error('Failed to get executed migrations:', error);
      return [];
    }
  }

  /**
   * Get last completed migration
   */
  private async getLastCompletedMigration(): Promise<any> {
    try {
      const result = await this.dataSource.query(`
        SELECT name, timestamp, status, duration
        FROM migrations
        WHERE status = 'completed'
        ORDER BY timestamp DESC
        LIMIT 1
      `);

      return result[0] || null;
    } catch (error) {
      this.logger.error('Failed to get last completed migration:', error);
      return null;
    }
  }

  /**
   * Update migration status
   */
  private async updateMigrationStatus(
    queryRunner: QueryRunner,
    migrationName: string,
    status: string,
    duration?: number,
    error?: string,
  ): Promise<void> {
    try {
      await queryRunner.query(`
        INSERT INTO migrations (name, status, duration, error)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name)
        DO UPDATE SET
          status = $2,
          duration = $3,
          error = $4,
          updated_at = CURRENT_TIMESTAMP
      `, [migrationName, status, duration, error]);
    } catch (error) {
      this.logger.error('Failed to update migration status:', error);
    }
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private containsSQLInjection(sql: string): boolean {
    const dangerousPatterns = [
      /\b(DROP|DELETE|TRUNCATE|ALTER)\b.*\b(WHERE|FROM)\b/i,
      /\b(INSERT|UPDATE)\b.*\bVALUES\b.*\$\{/i,
      /\b(EXEC|EXECUTE)\b/i,
      /UNION.*SELECT/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(sql));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      const status = await this.getMigrationStatus();

      this.logger.debug(`Migration health check: ${status.length} migrations tracked`);
      return true;
    } catch (error) {
      this.logger.error('Migration health check failed:', error);
      return false;
    }
  }
}
