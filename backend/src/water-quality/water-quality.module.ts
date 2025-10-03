import { Module, forwardRef } from '@nestjs/common';
import { MetricsModule } from '../observability/metrics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterQualityService } from './water-quality.service';
import { WaterQualityController } from './water-quality.controller';
import { WaterQualityReading } from './entities/water-quality-reading.entity';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterQualityReading]),
    MetricsModule,
    forwardRef(() => AlertsModule),
  ],
  controllers: [WaterQualityController],
  providers: [WaterQualityService],
  exports: [WaterQualityService],
})
export class WaterQualityModule {}
