import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { TenantTelemetryService } from '../tenant-telemetry.service';

@Injectable()
export class TenantRequiredGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private telemetry: TenantTelemetryService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const strictMode = process.env.TENANT_STRICT === 'true';
    // If route is marked public we still allow fallback but never error.
    // Guards run BEFORE interceptors, so we cannot rely solely on interceptor to populate tenantId.
    if (!req.tenantId) {
      const headerTenant =
        req.headers['x-tenant-id'] || req.headers['x-tenant'] || req.headers['tenant-id'];
      const tenantId = Array.isArray(headerTenant) ? headerTenant[0] : headerTenant;
      if (tenantId) {
        req.tenantId = tenantId;
      } else if (strictMode && !isPublic) {
        throw new BadRequestException('X-Tenant-Id header is required in strict mode');
      }
    }
    // Ù„Ø§ Ù†Ø¶Ø¹ Ù‚ÙŠÙ…Ø© fallback Ù‡Ù†Ø§ Ø­ØªÙ‰ ÙŠØ³Ù…Ø­ Ù„Ù„Ù€ Interceptor Ø¨ØªØ­ÙˆÙŠÙ„ Ø§Ù„ÙƒÙˆØ¯ Ø¥Ù„Ù‰ UUID
    // Later we could enforce presence when not public and not explicitly provided
    // (e.g., track telemetry if fallback used on non-public route).
    return true;
  }
}
