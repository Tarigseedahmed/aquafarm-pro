import { Module, Global, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService, ConfigService],
  exports: [RedisService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly redis: RedisService) {}
  async onModuleInit() {
    await this.redis.connect();
  }
  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}
