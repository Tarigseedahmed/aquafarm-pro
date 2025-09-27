import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLoggerService } from '../common/logging/pino-logger.service';
import { Tenant } from '../tenancy/entities/tenant.entity';
import { Pond } from './entities/pond.entity';
import { Farm } from '../farms/entities/farm.entity';
import { User } from '../users/entities/user.entity';
import { CreatePondDto } from './dto/create-pond.dto';
import { UpdatePondDto } from './dto/update-pond.dto';
import { FindAllPondsDto } from './dto/find-all-ponds.dto';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { buildMeta, envelope, PaginatedResult } from '../common/pagination/pagination';

@Injectable()
export class PondsService {
  constructor(
    @InjectRepository(Pond) private readonly pondRepository: Repository<Pond>,
    @InjectRepository(Farm) private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly logger: PinoLoggerService,
  ) {}

  async create(createPondDto: CreatePondDto, currentUser: User, tenantId: string): Promise<Pond> {
    let resolvedTenantId = tenantId;
    if (tenantId && !/^[0-9a-fA-F-]{36}$/.test(tenantId)) {
      const tenant = await this.tenantRepo.findOne({
        where: { code: tenantId.toLowerCase() },
      });
      resolvedTenantId = tenant?.id;
    }
    if (tenantId && !resolvedTenantId) {
      throw new NotFoundException({
        message: 'Tenant not found',
        code: ErrorCode.TENANT_NOT_FOUND,
      });
    }

    // Find farm respecting tenant; backfill legacy null tenant farms if matches
    let farm = await this.farmRepository.findOne({
      where: { id: createPondDto.farmId, tenantId: resolvedTenantId },
    });
    if (!farm) {
      const orphanFarm = await this.farmRepository.findOne({
        where: { id: createPondDto.farmId, tenantId: null as any },
      });
      if (orphanFarm) {
        orphanFarm.tenantId = resolvedTenantId;
        await this.farmRepository.save(orphanFarm);
        farm = orphanFarm;
      }
    }
    if (!farm) {
      throw new NotFoundException({ message: 'Farm not found', code: ErrorCode.FARM_NOT_FOUND });
    }

    const pondData = { ...createPondDto };
    if (pondData.area && pondData.depth && !pondData.volume) {
      pondData.volume = pondData.area * pondData.depth;
    }

    const pond = this.pondRepository.create({
      ...pondData,
      managedById: currentUser.id,
      tenantId: resolvedTenantId,
    });
    const saved = await this.pondRepository.save(pond);
    this.logger.info(
      { event: 'pond.created', pondId: saved.id, farmId: saved.farmId, tenantId },
      'Pond created',
    );
    return saved;
  }

  async findAll(queryDto: FindAllPondsDto, tenantId: string): Promise<PaginatedResult<Pond>> {
    const { farmId, status, search, page = 1, limit = 10 } = queryDto;
    const qb = this.pondRepository
      .createQueryBuilder('pond')
      .leftJoinAndSelect('pond.farm', 'farm')
      .leftJoinAndSelect('pond.managedBy', 'managedBy')
      .andWhere('pond.tenantId = :tenantId', { tenantId });
    if (farmId) qb.andWhere('pond.farmId = :farmId', { farmId });
    if (status) qb.andWhere('pond.status = :status', { status });
    if (search) qb.andWhere('pond.name ILIKE :search', { search: `%${search}%` });
    qb.orderBy('pond.createdAt', 'DESC');
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);
    const [ponds, total] = await qb.getManyAndCount();
    const meta = buildMeta(total, page, limit);
    return envelope(ponds, meta);
  }

  async findOne(id: string, tenantId: string): Promise<Pond> {
    const pond = await this.pondRepository
      .createQueryBuilder('pond')
      .leftJoinAndSelect('pond.farm', 'farm')
      .leftJoinAndSelect('pond.managedBy', 'managedBy')
      .where('pond.id = :id', { id })
      .andWhere('pond.tenantId = :tenantId', { tenantId })
      .getOne();
    if (!pond) {
      throw new NotFoundException({ message: 'Pond not found', code: ErrorCode.POND_NOT_FOUND });
    }
    return pond;
  }

  async update(id: string, updatePondDto: UpdatePondDto, tenantId: string): Promise<Pond> {
    const pond = await this.findOne(id, tenantId);
    const updateData = { ...updatePondDto };
    if ((updateData.area || updateData.depth) && !updateData.volume) {
      const newArea = updateData.area || pond.area;
      const newDepth = updateData.depth || pond.depth;
      updateData.volume = newArea * newDepth;
    }
    Object.assign(pond, updateData);
    return this.pondRepository.save(pond);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const pond = await this.findOne(id, tenantId);
    await this.pondRepository.remove(pond);
  }

  // Mock sample data (Arabic labels retained intentionally)
  async createMockPonds(): Promise<any[]> {
    return [
      {
        id: '1',
        name: 'Ø­ÙˆØ¶ Ø§Ù„Ø¨Ù„Ø·ÙŠ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ',
        farmId: 'mock-farm-1',
        area: 2000,
        depth: 2.5,
        volume: 5000,
        maxCapacity: 8000,
        currentStockCount: 6500,
        status: 'active',
        shape: 'rectangular',
        equipment: ['aerator', 'filter', 'temperature_sensor'],
        farm: { name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±' },
      },
      {
        id: '2',
        name: 'Ø­ÙˆØ¶ Ø§Ù„Ø­Ø¶Ø§Ù†Ø©',
        farmId: 'mock-farm-1',
        area: 800,
        depth: 1.5,
        volume: 1200,
        maxCapacity: 2000,
        currentStockCount: 1800,
        status: 'active',
        shape: 'circular',
        equipment: ['heater', 'filter'],
        farm: { name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±' },
      },
    ];
  }
}
