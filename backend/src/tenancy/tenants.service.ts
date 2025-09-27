import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Farm } from '../farms/entities/farm.entity';
import { Pond } from '../ponds/entities/pond.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../fish-batches/entities/feeding-record.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class TenantsService implements OnModuleInit {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Farm) private farmRepo: Repository<Farm>,
    @InjectRepository(Pond) private pondRepo: Repository<Pond>,
    @InjectRepository(WaterQualityReading) private wqRepo: Repository<WaterQualityReading>,
    @InjectRepository(FishBatch) private batchRepo: Repository<FishBatch>,
    @InjectRepository(FeedingRecord) private feedRepo: Repository<FeedingRecord>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultTenantAndBackfill();
  }

  private async ensureDefaultTenantAndBackfill() {
    const code = (process.env.DEFAULT_TENANT_CODE || 'default').toLowerCase();
    const name = process.env.DEFAULT_TENANT_NAME || 'Default Tenant';

    let tenant = await this.tenantRepo.findOne({ where: { code } });
    if (!tenant) {
      tenant = this.tenantRepo.create({ code, name });
      tenant = await this.tenantRepo.save(tenant);
      console.log(`[Tenancy] Created default tenant: ${tenant.code}`);
    }

    const defaultId = tenant.id;
    // Backfill only if there are null tenant rows
    const tables = [
      { repo: this.farmRepo, name: 'farms' },
      { repo: this.pondRepo, name: 'ponds' },
      { repo: this.wqRepo, name: 'water_quality_readings' },
      { repo: this.batchRepo, name: 'fish_batches' },
      { repo: this.feedRepo, name: 'feeding_records' },
      { repo: this.notifRepo, name: 'notifications' },
    ];
    for (const t of tables) {
      const countNull = await t.repo.createQueryBuilder().where('tenantId IS NULL').getCount();
      if (countNull > 0) {
        await t.repo
          .createQueryBuilder()
          .update()
          .set({ tenantId: defaultId })
          .where('tenantId IS NULL')
          .execute();
        console.log(`[Tenancy] Backfilled ${countNull} ${t.name} rows to tenant ${code}`);
      }
    }

    // Ensure users.tenantId exists (especially for sqlite test env) if migration didn't run yet
    try {
      const driver = this.tenantRepo.manager.connection.options.type;
      if (driver === 'sqlite') {
        const columns: Array<{ name: string }> = await this.tenantRepo.query(
          `PRAGMA table_info('users')`,
        );
        const exists = columns.some((c) => c.name === 'tenantId');
        if (!exists) {
          await this.tenantRepo.query(`ALTER TABLE "users" ADD COLUMN "tenantId" varchar`);
          try {
            await this.tenantRepo.query(
              `CREATE INDEX "idx_users_tenant_email" ON "users" ("tenantId", "email")`,
            );
          } catch {}
          console.log('[Tenancy] Added tenantId column to users (fallback)');
        }
      }
    } catch (e) {
      console.warn('[Tenancy] Failed ensuring users.tenantId column:', e.message);
    }
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const exists = await this.tenantRepo.findOne({ where: { code: dto.code } });
    if (exists)
      throw new ConflictException({
        message: 'Tenant code already exists',
        code: ErrorCode.VALIDATION_ERROR,
      });
    return this.tenantRepo.save(this.tenantRepo.create(dto));
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant)
      throw new NotFoundException({
        message: 'Tenant not found',
        code: ErrorCode.TENANT_NOT_FOUND,
      });
    return tenant;
  }

  async findByCodeOrId(codeOrId: string, fallbackId?: string): Promise<Tenant> {
    if (!codeOrId) {
      if (fallbackId) return this.findOne(fallbackId);
      throw new NotFoundException({
        message: 'Tenant context not resolved',
        code: ErrorCode.TENANT_NOT_FOUND,
      });
    }
    // Ø­Ø§ÙˆÙ„ ÙƒÙ€ id Ø£ÙˆÙ„Ø§Ù‹
    let tenant = await this.tenantRepo.findOne({ where: { id: codeOrId } });
    if (!tenant) {
      tenant = await this.tenantRepo.findOne({ where: { code: codeOrId } });
    }
    if (!tenant)
      throw new NotFoundException({
        message: 'Tenant not found',
        code: ErrorCode.TENANT_NOT_FOUND,
      });
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (dto.code && dto.code !== tenant.code) {
      const exists = await this.tenantRepo.findOne({ where: { code: dto.code } });
      if (exists)
        throw new ConflictException({
          message: 'Tenant code already exists',
          code: ErrorCode.VALIDATION_ERROR,
        });
    }
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    tenant.status = 'deleted';
    await this.tenantRepo.save(tenant);
  }
}
