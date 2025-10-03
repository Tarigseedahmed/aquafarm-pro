import { Module } from '@nestjs/common';
import { HealthService } from '../health/health.service';
import { HealthController } from '../health/health.controller';
import { AdvancedLoggingService } from '../logging/advanced-logging.service';
import { MetricsService } from '../metrics/metrics.service';
import { AlertingService } from '../alerting/alerting.service';
import { LoggingModule } from '../logging/logging.module';
import { RedisModule } from '../redis/redis.module';
import { MemoryModule } from '../memory/memory.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    LoggingModule,
    RedisModule,
    MemoryModule,
    CacheModule,
  ],
  providers: [
    HealthService,
    AdvancedLoggingService,
    MetricsService,
    AlertingService,
  ],
  controllers: [HealthController],
  exports: [
    HealthService,
    AdvancedLoggingService,
    MetricsService,
    AlertingService,
  ],
})
export class MonitoringModule {}
