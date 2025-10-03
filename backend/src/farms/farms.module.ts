import { Module } from '@nestjs/common';
import { MetricsModule } from '../observability/metrics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { Farm } from './entities/farm.entity';
import { Tenant } from '../tenancy/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, Tenant]), MetricsModule],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
