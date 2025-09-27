import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { FindAllFeedingRecordsDto } from './dto/find-all-feeding-records.dto';
import { buildMeta, envelope } from '../common/pagination/pagination';

@Injectable()
export class FeedingRecordsService {
  constructor(
    @InjectRepository(FeedingRecord) private feedRepo: Repository<FeedingRecord>,
    @InjectRepository(FishBatch) private batchRepo: Repository<FishBatch>,
  ) {}

  async create(dto: CreateFeedingRecordDto, user: any, tenantId: string) {
    // Verify batch belongs to tenant
    const batch = await this.batchRepo.findOne({ where: { id: dto.fishBatchId, tenantId } });
    if (!batch) throw new NotFoundException('Fish batch not found');

    const record = this.feedRepo.create({
      ...dto,
      feedingMethod: dto.feedingMethod || 'manual',
      fishAppetite: dto.fishAppetite || 'good',
      fishBatchId: dto.fishBatchId,
      recordedById: user.id,
      tenantId,
    });
    return this.feedRepo.save(record);
  }

  async findAll(query: FindAllFeedingRecordsDto, tenantId: string) {
    const { fishBatchId, page = 1, limit = 10 } = query;
    const qb = this.feedRepo
      .createQueryBuilder('fr')
      .andWhere('fr.tenantId = :tenantId', { tenantId });
    if (fishBatchId) qb.andWhere('fr.fishBatchId = :fishBatchId', { fishBatchId });
    qb.orderBy('fr.feedingTime', 'DESC');
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [records, total] = await qb.getManyAndCount();
    return { ...envelope(records, buildMeta(total, page, limit)), records };
  }
}
