import { Module, OnModuleInit } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [PrometheusController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule implements OnModuleInit {
  constructor(private readonly metrics: MetricsService) {}
  onModuleInit() {
    // Register default custom counters on startup (ensures they're visible early)
    this.metrics.init();
  }
}
