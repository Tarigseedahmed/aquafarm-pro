import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService } from './feature-flags.service';
import { FEATURE_FLAG_KEY } from './feature-flag.decorator';

@Injectable()
export class FeatureFlagsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private flags: FeatureFlagsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFlag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredFlag) return true;

    const req = context.switchToHttp().getRequest();
    const tenantId: string | undefined = req?.tenantId;
    const isOn = this.flags.isEnabled(requiredFlag, tenantId);
    if (!isOn) {
      throw new ForbiddenException(`Feature flag '${requiredFlag}' is disabled`);
    }
    return true;
  }
}
