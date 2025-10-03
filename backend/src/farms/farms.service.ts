import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { PinoLoggerService } from '../common/logging/pino-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenancy/entities/tenant.entity';
import { Farm } from './entities/farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private farmsRepository: Repository<Farm>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private logger: PinoLoggerService,
  ) {}

  async create(
    createFarmDto: CreateFarmDto,
    currentUserId: string,
    tenantId?: string,
  ): Promise<Farm> {
    let resolvedTenantId = tenantId;
    if (tenantId && !/^[0-9a-fA-F-]{36}$/.test(tenantId)) {
      const tenant = await this.tenantRepo.findOne({ where: { code: tenantId.toLowerCase() } });
      resolvedTenantId = tenant?.id;
    }
    // Ø¥Ø°Ø§ ØªÙ… ØªÙ‚Ø¯ÙŠÙ… ØªÙŠÙ†Ø§Ù†Øª ÙÙŠ Ø§Ù„Ù‡ÙŠØ¯Ø± ÙˆÙ„Ù… ÙŠØªÙ… Ø­Ù„Ù‡ ÙØ¹Ù„ÙŠØ§Ù‹ => Ù†Ø±ÙØ¶
    if (tenantId && !resolvedTenantId) {
      throw new NotFoundException({
        message: 'Tenant not found',
        code: ErrorCode.TENANT_NOT_FOUND,
      });
    }
    const farm = this.farmsRepository.create({
      ...createFarmDto,
      ownerId: currentUserId,
      tenantId: resolvedTenantId,
    });
    const saved = await this.farmsRepository.save(farm);
    this.logger.info({ event: 'farm.created', farmId: saved.id, tenantId }, 'Farm created');
    return saved;
  }

  async findAll(
    ownerId?: string,
    tenantId?: string,
    page = 1,
    limit = 25,
  ): Promise<{ items: Farm[]; total: number }> {
    const query = this.farmsRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.owner', 'owner')
      .leftJoinAndSelect('farm.ponds', 'ponds');

    if (tenantId) {
      query.andWhere('farm.tenantId = :tenantId', { tenantId });
    }
    if (ownerId) {
      query.andWhere('farm.ownerId = :ownerId', { ownerId });
    }
    query.skip((page - 1) * limit).take(limit);
    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, ownerId?: string, tenantId?: string): Promise<Farm> {
    const query = this.farmsRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.owner', 'owner')
      .leftJoinAndSelect('farm.ponds', 'ponds')
      .where('farm.id = :id', { id });

    if (tenantId) {
      query.andWhere('farm.tenantId = :tenantId', { tenantId });
    }
    if (ownerId) {
      query.andWhere('farm.ownerId = :ownerId', { ownerId });
    }

    const farm = await query.getOne();

    if (!farm) {
      throw new NotFoundException({ message: 'Farm not found', code: ErrorCode.FARM_NOT_FOUND });
    }

    return farm;
  }

  async update(
    id: string,
    updateFarmDto: UpdateFarmDto,
    ownerId?: string,
    tenantId?: string,
  ): Promise<Farm> {
    const farm = await this.findOne(id, ownerId, tenantId);

    if (ownerId && farm.ownerId !== ownerId) {
      throw new ForbiddenException({
        message: 'You can only update your own farms',
        code: ErrorCode.FORBIDDEN as any,
      });
    }

    Object.assign(farm, updateFarmDto);
    return this.farmsRepository.save(farm);
  }

  async remove(id: string, ownerId?: string, tenantId?: string): Promise<void> {
    const farm = await this.findOne(id, ownerId, tenantId);

    if (ownerId && farm.ownerId !== ownerId) {
      throw new ForbiddenException({
        message: 'You can only delete your own farms',
        code: ErrorCode.FORBIDDEN as any,
      });
    }

    await this.farmsRepository.remove(farm);
  }

  // Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø©
  async getFarmStats(farmId: string, ownerId?: string, tenantId?: string): Promise<any> {
    // SECURITY FIX: Always verify tenant ownership first
    const farm = await this.findOne(farmId, ownerId, tenantId);

    const query = this.farmsRepository
      .createQueryBuilder('farm')
      .leftJoin('farm.ponds', 'pond')
      .leftJoin('pond.fishBatches', 'batch')
      .leftJoin('pond.waterQualityReadings', 'wq')
      .select([
        'COUNT(DISTINCT pond.id) as pondCount',
        'SUM(pond.area) as totalPondArea',
        'SUM(pond.currentStockCount) as totalFishCount',
        'COUNT(DISTINCT batch.id) as activeBatches',
        'COUNT(DISTINCT wq.id) as qualityReadings',
      ])
      .where('farm.id = :farmId', { farmId });

    // Add tenant isolation to stats query
    if (tenantId) {
      query.andWhere('farm.tenantId = :tenantId', { tenantId });
    }

    const stats = await query.getRawOne();

    return {
      ...farm,
      statistics: stats,
    };
  }

  // Ø¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ© Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø±
  async createMockFarms(): Promise<Farm[]> {
    const mockFarms = [
      {
        name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±',
        description:
          'Ù…Ø²Ø±Ø¹Ø© Ø£Ø³Ù…Ø§Ùƒ Ø¨Ø­Ø±ÙŠØ© Ù…ØªØ®ØµØµØ© ÙÙŠ ØªØ±Ø¨ÙŠØ© Ø§Ù„Ù‡Ø§Ù…ÙˆØ± ÙˆØ§Ù„Ø³ÙŠØ¨Ø§Ø³',
        location: 'Ø¬Ø¯Ø©ØŒ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
        totalArea: 50000,
        farmType: 'marine',
        status: 'active',
        coordinates: { latitude: 21.5433, longitude: 39.1728 },
        contactPhone: '+966501234567',
        licenseNumber: 'MAR-2024-001',
        facilities: ['laboratory', 'feed_storage', 'processing_plant', 'office'],
        ownerId: '550e8400-e29b-41d4-a716-446655440000', // Ù…Ø¤Ù‚Øª
      },
      {
        name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ù…ÙŠØ§Ù‡ Ø§Ù„Ø¹Ø°Ø¨Ø© Ø§Ù„Ø±ÙŠØ§Ø¶',
        description: 'Ù…Ø²Ø±Ø¹Ø© Ù…ØªØ®ØµØµØ© ÙÙŠ ØªØ±Ø¨ÙŠØ© Ø§Ù„Ø¨Ù„Ø·ÙŠ ÙˆØ§Ù„ÙƒØ§Ø±Ø¨',
        location: 'Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
        totalArea: 30000,
        farmType: 'freshwater',
        status: 'active',
        coordinates: { latitude: 24.7136, longitude: 46.6753 },
        contactPhone: '+966509876543',
        licenseNumber: 'FRW-2024-002',
        facilities: ['feed_storage', 'office'],
        ownerId: '550e8400-e29b-41d4-a716-446655440000', // Ù…Ø¤Ù‚Øª
      },
    ];

    return mockFarms as Farm[];
  }
}
