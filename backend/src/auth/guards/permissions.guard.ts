import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { permissionsForRole } from '../authorization/permissions.enum';
import { throwForbidden } from '../../common/errors/forbidden.util';
import { MetricsService } from '../../observability/metrics.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private metrics: MetricsService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      const request = ctx.switchToHttp().getRequest();
      const routePath = request.route?.path || request.originalUrl || 'unknown';
      throwForbidden({
        message: 'Unauthenticated',
        required: required,
        granted: [],
        missing: ['missing_permissions'],
        reason: 'missing_permissions',
        route: routePath,
        metrics: this.metrics,
      });
    }
    const grantedArray = permissionsForRole(user.role);
    const granted = new Set<string>(grantedArray);
    const missing = required.filter((perm) => !granted.has(perm));
    if (missing.length) {
      const routePath = request.route?.path || request.originalUrl || 'unknown';
      throwForbidden({
        message: 'Missing required permissions',
        required,
        granted: grantedArray,
        missing,
        reason: 'missing_permissions',
        route: routePath,
        metrics: this.metrics,
      });
    }
    // Optional: attach permitted permissions and tenant to request context for downstream use
    request.grantedPermissions = grantedArray;
    request.tenantId = request.tenantId; // ensure property exists for typing clarity
    return true;
  }
}
