import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfitabilityAnalysis } from './entities/profitability-analysis.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { BiAnalysisService } from './bi-analysis.service';
import { BiController } from './bi.controller';
import { MetricsModule } from '../observability/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfitabilityAnalysis,
      WaterQualityReading,
      FishBatch,
      FeedingRecord,
    ]),
    MetricsModule,
  ],
  controllers: [BiController],
  providers: [BiAnalysisService],
  exports: [BiAnalysisService],
})
export class BiModule {}
