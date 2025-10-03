import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerConfigService } from './throttler-config.service';
import { RetryAfterInterceptor } from './retry-after.interceptor';
import { ThrottleProfileGuard } from './throttle-profile.guard';
import { EnhancedThrottlerService } from './enhanced-throttler.service';
import { EnhancedThrottleGuard } from './enhanced-throttle.guard';
import { LoggingModule } from '../logging/logging.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule, // SECURITY FIX AC-005: Add Redis for rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
        ],
      }),
    }),
    LoggingModule,
  ],
  providers: [
    ThrottlerConfigService,
    RetryAfterInterceptor,
    ThrottleProfileGuard,
    EnhancedThrottlerService,
    EnhancedThrottleGuard,
  ],
  exports: [
    ThrottlerConfigService,
    RetryAfterInterceptor,
    ThrottleProfileGuard,
    EnhancedThrottlerService,
    EnhancedThrottleGuard,
  ],
})
export class ThrottlingModule {}
