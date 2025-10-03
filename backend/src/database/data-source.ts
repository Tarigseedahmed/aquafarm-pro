import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

import { User } from '../users/entities/user.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Pond } from '../ponds/entities/pond.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Tenant } from '../tenancy/entities/tenant.entity';
import { TaxProfile } from '../accounting/entities/tax-profile.entity';
import { TaxRate } from '../accounting/entities/tax-rate.entity';
import { InvoiceSeries } from '../accounting/entities/invoice-series.entity';
import { FxRate } from '../accounting/entities/fx-rate.entity';

// Postgres detection: either explicit DB_TYPE=postgres or DATABASE_URL starting with postgres://
const isPostgres =
  process.env.DB_TYPE === 'postgres' ||
  (!!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://'));

export const AppDataSource = new DataSource({
  type: (isPostgres ? 'postgres' : 'sqlite') as any,
  database: isPostgres
    ? process.env.DB_NAME || (process.env.DATABASE_URL ? undefined : 'aquafarm')
    : process.env.SQLITE_DB || 'aquafarm.db',
  url: isPostgres ? process.env.DATABASE_URL : undefined,
  host: isPostgres ? process.env.DB_HOST : undefined,
  port: isPostgres && process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  username: isPostgres ? process.env.DB_USER : undefined,
  password: isPostgres ? process.env.DB_PASSWORD : undefined,
  ssl: isPostgres && process.env.DB_SSL === 'true' ? { 
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : undefined,
  // Pool & timeout tuning for Postgres runtime and migrations
  extra: isPostgres
    ? {
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10),
        application_name: process.env.DB_APP_NAME || 'aquafarm-migrations',
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000', 10),
        idle_in_transaction_session_timeout: parseInt(
          process.env.DB_IDLE_TX_TIMEOUT_MS || '30000',
          10,
        ),
      }
    : undefined,
  entities: [
    User,
    Farm,
    Pond,
    WaterQualityReading,
    FishBatch,
    FeedingRecord,
    Notification,
    Tenant,
    TaxProfile,
    TaxRate,
    InvoiceSeries,
    FxRate,
  ],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});
