import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
  extra?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
    evict: number;
    handleDisconnects: boolean;
  };
  logging?: boolean;
  synchronize?: boolean;
  migrationsRun?: boolean;
}

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  getDatabaseConfig(): DatabaseConfig {
    const isPostgres = this.configService.get<string>('DB_TYPE') === 'postgres';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const isTest = this.configService.get<string>('NODE_ENV') === 'test';

    const baseConfig: DatabaseConfig = {
      type: isPostgres ? 'postgres' : 'sqlite',
      logging: this.configService.get<string>('DB_LOG') === 'true' && !isTest,
      synchronize: isTest ? !isPostgres : false,
      migrationsRun: isPostgres && (this.configService.get<string>('MIGRATIONS_RUN') === 'true' || isTest),
    };

    if (isPostgres) {
      return {
        ...baseConfig,
        host: this.configService.get<string>('DB_HOST'),
        port: this.configService.get<string>('DB_PORT') ? parseInt(this.configService.get<string>('DB_PORT'), 10) : undefined,
        username: this.configService.get<string>('DB_USER'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        url: this.configService.get<string>('DATABASE_URL'),
        ssl: this.configService.get<string>('DB_SSL') === 'true' ? {
          rejectUnauthorized: this.configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !== 'false'
        } : undefined,
        extra: this.getConnectionPoolConfig(isProduction),
      };
    } else {
      return {
        ...baseConfig,
        database: isTest ? ':memory:' : this.configService.get<string>('SQLITE_DB') || 'aquafarm.db',
      };
    }
  }

  private getConnectionPoolConfig(isProduction: boolean) {
    if (isProduction) {
      // Production settings - optimized for high load
      return {
        max: parseInt(this.configService.get<string>('DB_POOL_MAX', '20')),
        min: parseInt(this.configService.get<string>('DB_POOL_MIN', '5')),
        acquire: parseInt(this.configService.get<string>('DB_POOL_ACQUIRE', '60000')), // 60 seconds
        idle: parseInt(this.configService.get<string>('DB_POOL_IDLE', '10000')), // 10 seconds
        evict: parseInt(this.configService.get<string>('DB_POOL_EVICT', '1000')), // 1 second
        handleDisconnects: true,
      };
    } else {
      // Development settings - smaller pool for development
      return {
        max: parseInt(this.configService.get<string>('DB_POOL_MAX', '10')),
        min: parseInt(this.configService.get<string>('DB_POOL_MIN', '2')),
        acquire: parseInt(this.configService.get<string>('DB_POOL_ACQUIRE', '30000')), // 30 seconds
        idle: parseInt(this.configService.get<string>('DB_POOL_IDLE', '10000')), // 10 seconds
        evict: parseInt(this.configService.get<string>('DB_POOL_EVICT', '1000')), // 1 second
        handleDisconnects: true,
      };
    }
  }

  getHealthCheckConfig() {
    return {
      timeout: 5000, // 5 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
    };
  }

  getMigrationConfig() {
    return {
      runMigrations: this.configService.get<string>('MIGRATIONS_RUN') === 'true',
      synchronize: false,
      dropSchema: false,
      logging: this.configService.get<string>('DB_LOG') === 'true',
    };
  }
}
