import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TenantInterceptor } from './tenant.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Pond } from '../ponds/entities/pond.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { AdminGuard } from './guards/admin.guard';
import { TenantRequiredGuard } from './guards/tenant-required.guard';
import { TenantTelemetryService } from './tenant-telemetry.service';
import { LoggingModule } from '../common/logging/logging.module';

@Module({
  imports: [
    LoggingModule,
    TypeOrmModule.forFeature([
      Tenant,
      Farm,
      Pond,
      WaterQualityReading,
      FishBatch,
      FeedingRecord,
      Notification,
    ]),
  ],
  controllers: [TenantsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TenantRequiredGuard,
    },
    TenantsService,
    TenantTelemetryService,
    AdminGuard,
  ],
  exports: [TenantsService],
})
export class TenancyModule {}
