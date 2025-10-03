import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FishBatch } from './entities/fish-batch.entity';
import { CreateFishBatchDto } from './dto/create-fish-batch.dto';
import { UpdateFishBatchDto } from './dto/update-fish-batch.dto';
import { FindAllFishBatchesDto } from './dto/find-all-fish-batches.dto';
import { buildMeta, envelope } from '../common/pagination/pagination';
import { Pond } from '../ponds/entities/pond.entity';

@Injectable()
export class FishBatchesService {
  constructor(
    @InjectRepository(FishBatch) private batchRepo: Repository<FishBatch>,
    @InjectRepository(Pond) private pondRepo: Repository<Pond>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateFishBatchDto, user: any, tenantId: string): Promise<FishBatch> {
    // Validate pond under tenant
    let pond = await this.pondRepo.findOne({ where: { id: dto.pondId, tenantId } });
    if (!pond) {
      // Backfill orphan pond (legacy)
      const orphan = await this.pondRepo.findOne({
        where: { id: dto.pondId, tenantId: null as any },
      });
      if (orphan) {
        orphan.tenantId = tenantId;
        pond = await this.pondRepo.save(orphan);
      }
    }
    if (!pond)
      throw new NotFoundException({ message: 'Pond not found', code: ErrorCode.POND_NOT_FOUND });

    const currentCount = dto.initialCount;
    const totalBiomass = Number((dto.averageWeight * currentCount).toFixed(2));

    const batch = this.batchRepo.create({
      ...dto,
      // legacy schema has NOT NULL on variety in initial migration; use species as fallback label
      variety: dto.variety ?? dto.species,
      currentCount,
      totalBiomass,
      managedById: user.id,
      tenantId,
      stockingDate: dto.stockingDate ? new Date(dto.stockingDate) : new Date(),
      expectedHarvestDate: dto.expectedHarvestDate ? new Date(dto.expectedHarvestDate) : null,
      status: 'active',
    });
    return this.batchRepo.save(batch);
  }

  async findAll(query: FindAllFishBatchesDto, tenantId: string) {
    const { pondId, status, search, page = 1, limit = 10 } = query;
    // PERFORMANCE FIX AC-010: Removed eager loading of feedingRecords to prevent N+1 query
    // Frontend should fetch feeding records separately if needed for specific batch
    const qb = this.batchRepo
      .createQueryBuilder('batch')
      .andWhere('batch.tenantId = :tenantId', { tenantId });

    if (pondId) qb.andWhere('batch.pondId = :pondId', { pondId });
    if (status) qb.andWhere('batch.status = :status', { status });
    if (search) {
      qb.andWhere('(batch.batchNumber ILIKE :s OR batch.species ILIKE :s)', { s: `%${search}%` });
    }
    qb.orderBy('batch.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [batches, total] = await qb.getManyAndCount();
    return {
      ...envelope(batches, buildMeta(total, page, limit)),
      batches, // backward compatibility
    };
  }

  async findOne(id: string, tenantId: string): Promise<FishBatch> {
    const batch = await this.batchRepo.findOne({ where: { id, tenantId } });
    if (!batch)
      throw new NotFoundException({
        message: 'Fish batch not found',
        code: ErrorCode.FISH_BATCH_NOT_FOUND,
      });
    return batch;
  }

  async update(id: string, dto: UpdateFishBatchDto, tenantId: string) {
    // AC-DB-04 FIX: Use pessimistic write lock to prevent race conditions on currentCount
    return this.dataSource.transaction(async (manager) => {
      const batch = await manager.findOne(FishBatch, {
        where: { id, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!batch) {
        throw new NotFoundException({
          message: 'Fish batch not found',
          code: ErrorCode.FISH_BATCH_NOT_FOUND,
        });
      }

      Object.assign(batch, dto);

      // Recompute biomass if counts or avg weight changed
      if (
        (dto.currentCount !== undefined || dto.averageWeight !== undefined) &&
        batch.currentCount &&
        batch.averageWeight
      ) {
        batch.totalBiomass = Number((batch.currentCount * Number(batch.averageWeight)).toFixed(2));
      }

      return manager.save(FishBatch, batch);
    });
  }

  async remove(id: string, tenantId: string) {
    const batch = await this.findOne(id, tenantId);
    await this.batchRepo.remove(batch);
    return { deleted: true };
  }
}
