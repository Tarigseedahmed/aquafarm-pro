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
    const grantedArray = permissionsForRole(user.role);
    const granted = new Set<string>(grantedArray);
    const missing = required.filter((perm) => !granted.has(perm));
    if (missing.length) {
      throw new ForbiddenException({
        error: 'Forbidden',
        message: 'Missing required permissions',
        required,
        granted: grantedArray,
        missing,
      } as any);
    }
    return true;
  }
}

