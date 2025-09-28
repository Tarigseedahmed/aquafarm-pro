import { Module } from '@nestjs/common';
import { EventEmitter } from 'events';
import { MetricsModule } from '../observability/metrics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), MetricsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: 'NOTIFICATIONS_EVENT_EMITTER',
      useFactory: () => new EventEmitter(),
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
