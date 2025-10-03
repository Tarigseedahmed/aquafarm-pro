import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { SecurityHeadersService } from './security-headers.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  constructor(
    private securityHeadersService: SecurityHeadersService,
    private logger: PinoLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        try {
          // Apply security headers
          this.securityHeadersService.applySecurityHeaders(response);

          // Log security headers application
          this.logger.debug(
            {
              event: 'security.headers.applied',
              url: request.url,
              method: request.method,
              userAgent: request.get('User-Agent'),
              ip: request.ip,
            },
            'Security headers applied to response'
          );
        } catch (error) {
          this.logger.error(
            {
              event: 'security.headers.error',
              error: error.message,
              url: request.url,
              method: request.method,
            },
            'Failed to apply security headers'
          );
        }
      }),
    );
  }
}

/**
 * Interceptor for API endpoints with stricter security headers
 */
@Injectable()
export class ApiSecurityHeadersInterceptor implements NestInterceptor {
  constructor(
    private securityHeadersService: SecurityHeadersService,
    private logger: PinoLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        try {
          // Apply stricter security headers for API endpoints
          const apiConfig = {
            contentSecurityPolicy: {
              enabled: true,
              directives: {
                'default-src': ["'none'"],
                'script-src': ["'none'"],
                'style-src': ["'none'"],
                'img-src': ["'none'"],
                'font-src': ["'none'"],
                'connect-src': ["'none'"],
                'media-src': ["'none'"],
                'object-src': ["'none'"],
                'base-uri': ["'none'"],
                'form-action': ["'none'"],
                'frame-ancestors': ["'none'"],
                'manifest-src': ["'none'"],
                'worker-src': ["'none'"],
              },
            },
            frameOptions: {
              enabled: true,
              value: 'DENY' as const,
            },
            permissionsPolicy: {
              enabled: true,
              features: {
                'geolocation': [],
                'microphone': [],
                'camera': [],
                'payment': [],
                'usb': [],
                'magnetometer': [],
                'gyroscope': [],
                'speaker': [],
                'vibrate': [],
                'fullscreen': [],
                'sync-xhr': [],
                'picture-in-picture': [],
                'accelerometer': [],
                'ambient-light-sensor': [],
                'autoplay': [],
                'battery': [],
                'clipboard-read': [],
                'clipboard-write': [],
                'display-capture': [],
                'document-domain': [],
                'encrypted-media': [],
                'execution-while-not-rendered': [],
                'execution-while-out-of-viewport': [],
                'focus-without-user-activation': [],
                'gamepad': [],
                'layout-animations': [],
                'legacy-image-formats': [],
                'midi': [],
                'notifications': [],
                'oversized-images': [],
                'push': [],
                'screen-wake-lock': [],
                'unoptimized-images': [],
                'unsized-media': [],
                'vertical-scroll': [],
                'web-share': [],
                'xr-spatial-tracking': [],
              },
            },
          };

          this.securityHeadersService.applySecurityHeaders(response, apiConfig);

          // Add API-specific headers
          response.setHeader('X-API-Version', '1.0');
          response.setHeader('X-Content-Type-Options', 'nosniff');
          response.setHeader('X-Download-Options', 'noopen');
          response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

          this.logger.debug(
            {
              event: 'security.api.headers.applied',
              url: request.url,
              method: request.method,
              userAgent: request.get('User-Agent'),
              ip: request.ip,
            },
            'API security headers applied to response'
          );
        } catch (error) {
          this.logger.error(
            {
              event: 'security.api.headers.error',
              error: error.message,
              url: request.url,
              method: request.method,
            },
            'Failed to apply API security headers'
          );
        }
      }),
    );
  }
}

/**
 * Interceptor for static file serving with appropriate security headers
 */
@Injectable()
export class StaticFileSecurityHeadersInterceptor implements NestInterceptor {
  constructor(
    private securityHeadersService: SecurityHeadersService,
    private logger: PinoLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        try {
          // Apply security headers appropriate for static files
          const staticConfig = {
            contentSecurityPolicy: {
              enabled: true,
              directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:', 'https:'],
                'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
                'connect-src': ["'self'"],
                'media-src': ["'self'"],
                'object-src': ["'none'"],
                'base-uri': ["'self'"],
                'form-action': ["'self'"],
                'frame-ancestors': ["'none'"],
                'manifest-src': ["'self'"],
                'worker-src': ["'self'"],
              },
            },
            frameOptions: {
              enabled: true,
              value: 'SAMEORIGIN' as const,
            },
          };

          this.securityHeadersService.applySecurityHeaders(response, staticConfig);

          // Add static file specific headers
          const filePath = request.url;
          const extension = filePath.split('.').pop()?.toLowerCase();

          // Set appropriate cache headers
          if (['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2'].includes(extension)) {
            response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            response.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
          } else {
            response.setHeader('Cache-Control', 'public, max-age=3600');
          }

          // Set ETag for better caching
          if (!response.getHeader('ETag')) {
            const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
            response.setHeader('ETag', etag);
          }

          this.logger.debug(
            {
              event: 'security.static.headers.applied',
              url: request.url,
              method: request.method,
              extension,
              userAgent: request.get('User-Agent'),
              ip: request.ip,
            },
            'Static file security headers applied to response'
          );
        } catch (error) {
          this.logger.error(
            {
              event: 'security.static.headers.error',
              error: error.message,
              url: request.url,
              method: request.method,
            },
            'Failed to apply static file security headers'
          );
        }
      }),
    );
  }
}
