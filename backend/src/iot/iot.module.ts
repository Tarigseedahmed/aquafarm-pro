import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IotController } from './iot.controller';
import { WaterQualityModule } from '../water-quality/water-quality.module';
import { MetricsModule } from '../observability/metrics.module';

@Module({
  imports: [ConfigModule, WaterQualityModule, MetricsModule],
  controllers: [IotController],
})
export class IotModule {}
