import { Module } from '@nestjs/common';
import { ImageOptimizationService } from './image-optimization.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [ImageOptimizationService],
  exports: [ImageOptimizationService],
})
export class ImageModule {}
