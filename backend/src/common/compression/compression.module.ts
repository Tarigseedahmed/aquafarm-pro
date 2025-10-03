import { Module } from '@nestjs/common';
import { CompressionService } from './compression.service';
import { CompressionInterceptor, StreamCompressionInterceptor } from './compression.interceptor';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [CompressionService, CompressionInterceptor, StreamCompressionInterceptor],
  exports: [CompressionService, CompressionInterceptor, StreamCompressionInterceptor],
})
export class CompressionModule {}
