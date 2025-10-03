import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { Alert } from './entities/alert.entity';
import { AlertEngineService } from './alert-engine.service';
import { AlertsController } from './alerts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaterQualityModule } from '../water-quality/water-quality.module';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { MetricsModule } from '../observability/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertRule, Alert, WaterQualityReading]),
    NotificationsModule,
    MetricsModule,
    forwardRef(() => WaterQualityModule),
  ],
  controllers: [AlertsController],
  providers: [AlertEngineService],
  exports: [AlertEngineService],
})
export class AlertsModule {}
