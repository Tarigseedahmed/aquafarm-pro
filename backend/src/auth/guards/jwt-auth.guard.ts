import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MetricsService } from '../../observability/metrics.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PinoLoggerService } from '../../common/logging/pino-logger.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private logger: PinoLoggerService,
    private metrics: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.safeIncUnauthorized(request.path);
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token); // secret configured globally
      request['user'] = { ...payload, id: payload.sub };
    } catch {
      this.safeIncUnauthorized(request.path);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private safeIncUnauthorized(route: string | undefined) {
    try {
      if (route) this.metrics.incUnauthorized(route);
    } catch {}
  }
}
