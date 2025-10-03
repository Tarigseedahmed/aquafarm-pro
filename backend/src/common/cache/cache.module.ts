import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor, CacheEvictInterceptor } from './cache.interceptor';
import { RedisModule } from '../redis/redis.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [RedisModule, LoggingModule],
  providers: [CacheService, CacheInterceptor, CacheEvictInterceptor],
  exports: [CacheService, CacheInterceptor, CacheEvictInterceptor],
})
export class CacheModule {}
