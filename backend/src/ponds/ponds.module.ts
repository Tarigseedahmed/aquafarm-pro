import { Module } from '@nestjs/common';
import { MetricsModule } from '../observability/metrics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PondsService } from './ponds.service';
import { PondsController } from './ponds.controller';
import { Pond } from './entities/pond.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Tenant } from '../tenancy/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pond, Farm, Tenant]), MetricsModule],
  controllers: [PondsController],
  providers: [PondsService],
  exports: [PondsService],
})
export class PondsModule {}
