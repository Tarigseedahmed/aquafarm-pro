import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { RedisModule } from '../redis/redis.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [RedisModule, LoggingModule],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
