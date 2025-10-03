import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { WaterQualityModule } from './water-quality/water-quality.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PondsModule } from './ponds/ponds.module';
import { TenancyModule } from './tenancy/tenancy.module';
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
import { FxRate } from './accounting/entities/fx-rate.entity';
import { MetricsModule } from './observability/metrics.module';
import { RedisModule } from './redis/redis.module';
import { ThrottlingModule } from './common/throttling/throttling.module';
import { ThrottleProfileGuard } from './common/throttling/throttle-profile.guard';
import { RetryAfterInterceptor } from './common/throttling/retry-after.interceptor';
import { FeatureFlagsModule } from './common/feature-flags/feature-flags.module';
import { IotModule } from './iot/iot.module';
import { AlertsModule } from './alerts/alerts.module';
import { BiModule } from './bi/bi.module';
import { FeatureFlagsGuard } from './common/feature-flags/feature-flags.guard';
import { AuditModule } from './audit/audit.module';
import { AuditSubscriber } from './audit/audit.subscriber';
import { AuditLog } from './audit/audit-log.entity';
import { SecurityConfigService } from './common/config/security.config';
import { DatabaseConfigService } from './common/database/database.config';
import { CacheModule } from './common/cache/cache.module';
import { CompressionModule } from './common/compression/compression.module';
import { JobModule } from './common/jobs/job.module';
import { MemoryModule } from './common/memory/memory.module';
import { ImageModule } from './common/image/image.module';
import { SecurityModule } from './common/security/security.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';
// RequestContextMiddleware imported only in main bootstrap, not needed here.

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlingModule,
    CacheModule,
    CompressionModule,
    JobModule,
    MemoryModule,
    ImageModule,
    SecurityModule,
    MonitoringModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        const isDevelopment = process.env.NODE_ENV === 'development';

        // Simple database configuration for development
        const config = {
          type: 'postgres' as const,
          host: configService.get('DB_HOST', 'localhost'),
          port: parseInt(configService.get('DB_PORT', '5432')),
          username: configService.get('DB_USER', 'postgres'),
          password: configService.get('DB_PASSWORD', 'admin123'),
          database: configService.get('DB_NAME', 'aquapro_dev'),
          synchronize: false, // Use schema.sql for initialization
          logging: isDevelopment,
          entities: [], // Disable entities to use schema.sql only
          subscribers: [AuditSubscriber],
          dropSchema: isTest,
          migrations: isTest
            ? []
            : [
                __filename.endsWith('.ts')
                  ? 'src/database/migrations/*.ts'
                  : 'dist/database/migrations/*.js',
              ],
          // Connection pool and timeouts for Postgres
          extra: {
            max: parseInt(process.env.DB_POOL_MAX || '20', 10),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10),
            application_name: process.env.DB_APP_NAME || 'aquafarm-backend',
            statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000', 10),
            idle_in_transaction_session_timeout: parseInt(
              process.env.DB_IDLE_TX_TIMEOUT_MS || '30000',
              10,
            ),
          },
        };

        return config as any;
      },
    }),
    AuthModule,
    FeatureFlagsModule,
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
    IotModule,
    AlertsModule,
    BiModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottleProfileGuard },
    { provide: APP_GUARD, useClass: FeatureFlagsGuard },
    { provide: APP_INTERCEPTOR, useClass: RetryAfterInterceptor },
    SecurityConfigService,
  ],
})
export class AppModule {}
