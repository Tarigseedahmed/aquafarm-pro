import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecordsService } from './feeding-records.service';
import { FeedingRecordsController } from './feeding-records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingRecord, FishBatch])],
  controllers: [FeedingRecordsController],
  providers: [FeedingRecordsService],
  exports: [FeedingRecordsService],
})
export class FeedingRecordsModule {}
