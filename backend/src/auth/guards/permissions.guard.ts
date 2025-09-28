import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { permissionsForRole } from '../authorization/permissions.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Unauthenticated');
  const granted = new Set<string>(permissionsForRole(user.role));
  const missing = required.filter((perm) => !granted.has(perm));
    if (missing.length) {
      throw new ForbiddenException('Missing permissions: ' + missing.join(','));
    }
    return true;
  }
}
