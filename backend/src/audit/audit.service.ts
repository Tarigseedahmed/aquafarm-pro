import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLog } from './audit-log.entity';

interface CreateAuditLog {
  entity: string;
  entityId?: string | null;
  action: 'insert' | 'update' | 'remove';
  before?: any | null;
  after?: any | null;
  changedKeys?: string[] | null;
  tenantId?: string | null;
  userId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(entry: CreateAuditLog) {
    const rec = this.repo.create({
      entity: entry.entity,
      entityId: entry.entityId || null,
      action: entry.action,
      before: entry.before ?? null,
      after: entry.after ?? null,
      changedKeys: entry.changedKeys || null,
      tenantId: entry.tenantId || null,
      userId: entry.userId || null,
    });
    return this.repo.save(rec);
  }

  async list(opts: { entity?: string; limit?: number; page?: number }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const take = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 25;
    const where: any = {};
    if (opts.entity) where.entity = In([opts.entity]);
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip: (page - 1) * take,
    });
    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
        hasNext: page * take < total,
        hasPrev: page > 1,
      },
    };
  }
}
