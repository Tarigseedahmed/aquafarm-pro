import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FishBatch } from './entities/fish-batch.entity';
import { Pond } from '../ponds/entities/pond.entity';
import { FishBatchesService } from './fish-batches.service';
import { FishBatchesController } from './fish-batches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FishBatch, Pond])],
  controllers: [FishBatchesController],
  providers: [FishBatchesService],
  exports: [FishBatchesService],
})
export class FishBatchesModule {}
