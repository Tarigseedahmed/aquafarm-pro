import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { WaterQualityModule } from './water-quality/water-quality.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PondsModule } from './ponds/ponds.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { LoggingModule } from './common/logging/logging.module';
import { FishBatchesModule } from './fish-batches/fish-batches.module';
import { FeedingRecordsModule } from './feeding-records/feeding-records.module';
import { User } from './users/entities/user.entity';
import { Farm } from './farms/entities/farm.entity';
import { Pond } from './ponds/entities/pond.entity';
import { WaterQualityReading } from './water-quality/entities/water-quality-reading.entity';
import { FishBatch } from './fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from './fish-batches/entities/feeding-record.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Tenant } from './tenancy/entities/tenant.entity';
import { MetricsModule } from './observability/metrics.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'global',
          ttl: 60, // 60 second window
          limit: 100, // default: 100 requests / window / IP
        },
      ],
    }),
    LoggingModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isPostgres = process.env.DB_TYPE === 'postgres';
        const isTest = process.env.NODE_ENV === 'test';
        const disableMigrationsInTest = isTest && !isPostgres;
        return {
          type: (isPostgres ? 'postgres' : 'sqlite') as any,
          ...(isPostgres
            ? {
                url: process.env.DATABASE_URL,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
              }
            : {}),
          database: isPostgres
            ? undefined
            : isTest
              ? ':memory:'
              : process.env.SQLITE_DB || 'aquafarm.db',
          entities: [
            User,
            Farm,
            Pond,
            WaterQualityReading,
            FishBatch,
            FeedingRecord,
            Notification,
            Tenant,
          ],
          synchronize: isTest ? !isPostgres : false,
          dropSchema: isTest && !isPostgres,
          logging: process.env.DB_LOG === 'true' && !isTest,
          migrations: disableMigrationsInTest
            ? []
            : [
                __filename.endsWith('.ts')
                  ? 'src/database/migrations/*.ts'
                  : 'dist/database/migrations/*.js',
              ],
          migrationsRun: isPostgres && (process.env.MIGRATIONS_RUN === 'true' || isTest),
        };
      },
    }),
    AuthModule,
    UsersModule,
    FarmsModule,
    PondsModule,
    WaterQualityModule,
    NotificationsModule,
    FishBatchesModule,
    FeedingRecordsModule,
    TenancyModule,
    MetricsModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
