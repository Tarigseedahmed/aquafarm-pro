import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
