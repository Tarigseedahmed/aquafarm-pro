import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { TenantTelemetryService } from './tenant-telemetry.service';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { InjectRepository } from '@nestjs/typeorm';

// Interceptor extracts tenant id from request (header, host, or fallback)
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private dataSource: DataSource,
    private telemetry: TenantTelemetryService,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    // Priority: explicit header > subdomain (future) > default
    const headerTenant =
      request.headers['x-tenant-id'] || request.headers['x-tenant'] || request.headers['tenant-id'];
    const hadHeader = !!headerTenant;
    let tenantKey: string | undefined = Array.isArray(headerTenant)
      ? headerTenant[0]
      : headerTenant;

    // TODO: implement subdomain extraction strategy later
    if (!tenantKey) {
      tenantKey = process.env.DEFAULT_TENANT_CODE || 'default';
      this.telemetry.recordFallback({
        route: request.originalUrl || request.url,
        method: request.method,
        public: false,
        strictMode: process.env.TENANT_STRICT === 'true',
        hadHeader,
        resolvedTenantId: tenantKey,
        message: 'Applied fallback tenant (interceptor pre-guard)',
      });
    }
    // Resolve tenant id from code or id
    let tenantEntity: Tenant | undefined;
    if (tenantKey) {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(tenantKey);
      if (isUuid) {
        tenantEntity = await this.tenantRepo.findOne({ where: { id: tenantKey } });
        if (!tenantEntity) {
          tenantEntity = await this.tenantRepo.findOne({
            where: { code: tenantKey.toLowerCase() },
          });
        }
      } else {
        tenantEntity = await this.tenantRepo.findOne({ where: { code: tenantKey.toLowerCase() } });
      }
    }
    if (tenantEntity) {
      request.tenantCode = tenantEntity.code;
      request.tenantId = tenantEntity.id; // actual UUID id used for FK
    } else {
      // Fallback: keep original key (may cause FK issue if used directly)
      request.tenantCode = tenantKey;
      request.tenantId = tenantKey;
    }
    // For Postgres + RLS environments set a per-connection GUC used by policies (best-effort)
    try {
      if (this.dataSource.options.type === 'postgres') {
        const effectiveTenantId = tenantEntity?.id || tenantKey;
        // Use standard SET LOCAL so it's transaction-scoped if a tx starts later; fallback to SET if outside tx.
        await this.dataSource.query(`SET app.tenant_id = $1`, [effectiveTenantId]);
      }
    } catch (err) {
      // Non-fatal: log only in dev to avoid leaking details; RLS policies will fail loudly if misconfigured.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[TenantInterceptor] Failed to SET app.tenant_id GUC:', err.message);
      }
    }
    return next.handle();
  }
}
