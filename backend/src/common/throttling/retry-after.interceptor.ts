import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerConfigService } from './throttler-config.service';

@Injectable()
export class RetryAfterInterceptor implements NestInterceptor {
  constructor(private throttlerConfig: ThrottlerConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof ThrottlerException) {
          // Extract profile name from the request or use default
          const request = context.switchToHttp().getRequest();
          const profileName = this.extractProfileName(request) || 'api';

          // Calculate retry-after value
          const resp = error.getResponse();
          const remaining =
            typeof resp === 'object' && resp && 'remainingRequests' in resp
              ? (resp as any).remainingRequests || 0
              : 0;
          const retryAfter = this.throttlerConfig.getRetryAfterHeader(profileName, remaining);

          // Create new exception with retry-after header
          const throttlerError = new HttpException(
            {
              message: 'Too many requests',
              retryAfter,
              profile: profileName,
              timestamp: new Date().toISOString(),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );

          // Add retry-after header
          const response = context.switchToHttp().getResponse();
          response.setHeader('Retry-After', retryAfter);
          response.setHeader('X-RateLimit-Limit', this.getRateLimit(profileName));
          response.setHeader('X-RateLimit-Remaining', remaining);
          response.setHeader(
            'X-RateLimit-Reset',
            new Date(Date.now() + retryAfter * 1000).toISOString(),
          );

          return throwError(() => throttlerError);
        }

        return throwError(() => error);
      }),
    );
  }

  private extractProfileName(request: any): string | null {
    // Try to extract profile from custom header
    const profileHeader = request.headers['x-throttle-profile'];
    if (profileHeader) {
      return profileHeader;
    }

    // Extract from route path
    const path = request.route?.path || request.url;

    // Authentication routes
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return 'auth';
    }

    if (path.includes('/auth/forgot-password') || path.includes('/auth/reset-password')) {
      return 'password-reset';
    }

    // Water quality routes
    if (path.includes('/water-quality')) {
      return 'water-quality';
    }

    // File upload routes
    if (path.includes('/upload') || path.includes('/files')) {
      return 'file-upload';
    }

    // Reports routes
    if (path.includes('/reports')) {
      return 'reports';
    }

    // Metrics routes
    if (path.includes('/metrics')) {
      return 'metrics';
    }

    // Default to API profile
    return 'api';
  }

  private getRateLimit(profileName: string): number {
    const profile = this.throttlerConfig.getProfile(profileName);
    return profile?.limit || 100;
  }
}
