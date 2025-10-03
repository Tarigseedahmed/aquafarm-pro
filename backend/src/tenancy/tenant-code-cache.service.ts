import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

interface CacheEntry {
  tenant: Tenant;
  expiresAt: number;
}

@Injectable()
export class TenantCodeCacheService {
  private readonly logger = new Logger(TenantCodeCacheService.name);
  private readonly ttlMs: number;
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  constructor(@InjectRepository(Tenant) private tenantRepo: Repository<Tenant>) {
    const raw = process.env.TENANT_CACHE_TTL_MS || '300000'; // 5 minutes default
    const parsed = parseInt(raw, 10);
    this.ttlMs = Number.isFinite(parsed) && parsed > 1000 ? parsed : 300000;
  }

  /** For metrics export (future Prometheus gauge integration) */
  snapshotStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      ttlMs: this.ttlMs,
    };
  }

  private set(tenant: Tenant) {
    const expiresAt = Date.now() + this.ttlMs;
    // store by id and code (lowercased) with namespace prefix for isolation
    this.cache.set(`tenant:id:${tenant.id}`, { tenant, expiresAt });
    this.cache.set(`tenant:code:${tenant.code.toLowerCase()}`, { tenant, expiresAt });
  }

  /**
   * Remove all cache entries that reference the given tenant id (id & code aliases).
   */
  invalidate(idOrCode: string) {
    let removed = 0;
    for (const [k, v] of [...this.cache.entries()]) {
      if (v.tenant.id === idOrCode || v.tenant.code === idOrCode) {
        this.cache.delete(k);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Invalidated ${removed} tenant cache entries for key=${idOrCode}`);
    }
  }

  clearAll() {
    this.cache.clear();
  }

  private getFromCache(key: string): Tenant | undefined {
    const normalized = key.toLowerCase();
    // Try both ID and code patterns
    let entry = this.cache.get(`tenant:id:${normalized}`);
    if (!entry) {
      entry = this.cache.get(`tenant:code:${normalized}`);
    }
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(`tenant:id:${normalized}`);
      this.cache.delete(`tenant:code:${normalized}`);
      return undefined;
    }
    return entry.tenant;
  }

  async resolve(key: string | undefined): Promise<Tenant | undefined> {
    if (!key) return undefined;
    const normalized = key.toLowerCase();
    const cached = this.getFromCache(normalized);
    if (cached) {
      this.hits++;
      return cached;
    }
    this.misses++;
    let tenant: Tenant | null = null;
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(key);
    if (isUuid) {
      tenant = await this.tenantRepo.findOne({ where: { id: key } });
      if (!tenant) {
        tenant = await this.tenantRepo.findOne({ where: { code: normalized } });
      }
    } else {
      tenant = await this.tenantRepo.findOne({ where: { code: normalized } });
    }
    if (tenant) this.set(tenant);
    return tenant || undefined;
  }
}
