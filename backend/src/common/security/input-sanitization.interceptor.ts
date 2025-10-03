import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { InputSanitizationService } from './input-sanitization.service';
import { PinoLoggerService } from '../logging/pino-logger.service';

@Injectable()
export class InputSanitizationInterceptor implements NestInterceptor {
  constructor(
    private sanitizationService: InputSanitizationService,
    private logger: PinoLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    try {
      // Sanitize request body
      if (request.body && typeof request.body === 'object') {
        const bodyResult = this.sanitizationService.sanitizeInput(request.body);
        request.body = bodyResult.sanitized;

        if (bodyResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.body.violations',
              violations: bodyResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `Body sanitization violations: ${bodyResult.violations.length}`
          );
        }
      }

      // Sanitize query parameters
      if (request.query && typeof request.query === 'object') {
        const queryResult = this.sanitizationService.sanitizeInput(request.query);
        request.query = queryResult.sanitized;

        if (queryResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.query.violations',
              violations: queryResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `Query sanitization violations: ${queryResult.violations.length}`
          );
        }
      }

      // Sanitize route parameters
      if (request.params && typeof request.params === 'object') {
        const paramsResult = this.sanitizationService.sanitizeInput(request.params);
        request.params = paramsResult.sanitized;

        if (paramsResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.params.violations',
              violations: paramsResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `Params sanitization violations: ${paramsResult.violations.length}`
          );
        }
      }

      const processingTime = Date.now() - startTime;

      this.logger.debug(
        {
          event: 'input.sanitization.completed',
          url: request.url,
          method: request.method,
          processingTime,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        `Input sanitization completed in ${processingTime}ms`
      );

      return next.handle();
    } catch (error) {
      this.logger.error(
        {
          event: 'input.sanitization.error',
          error: error.message,
          url: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        'Input sanitization failed'
      );

      throw new BadRequestException('Invalid input data');
    }
  }
}

/**
 * Interceptor for API endpoints with stricter sanitization
 */
@Injectable()
export class ApiInputSanitizationInterceptor implements NestInterceptor {
  constructor(
    private sanitizationService: InputSanitizationService,
    private logger: PinoLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    try {
      // Use stricter sanitization options for API endpoints
      const strictOptions = {
        stripHtml: true,
        escapeHtml: true,
        normalizeWhitespace: true,
        removeNullBytes: true,
        maxLength: 5000, // Shorter max length for API
        allowedTags: [],
        allowedAttributes: {},
        forbiddenTags: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style', 'base'],
        forbiddenAttributes: [
          'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
          'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup',
          'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseout',
          'onmouseenter', 'onmouseleave', 'ondblclick', 'oncontextmenu',
        ],
      };

      // Sanitize request body
      if (request.body && typeof request.body === 'object') {
        const bodyResult = this.sanitizationService.sanitizeInput(request.body, strictOptions);
        request.body = bodyResult.sanitized;

        if (bodyResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.api.body.violations',
              violations: bodyResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `API body sanitization violations: ${bodyResult.violations.length}`
          );

          // For API endpoints, we might want to reject requests with violations
          if (bodyResult.violations.length > 3) {
            throw new BadRequestException('Too many input sanitization violations');
          }
        }
      }

      // Sanitize query parameters
      if (request.query && typeof request.query === 'object') {
        const queryResult = this.sanitizationService.sanitizeInput(request.query, strictOptions);
        request.query = queryResult.sanitized;

        if (queryResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.api.query.violations',
              violations: queryResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `API query sanitization violations: ${queryResult.violations.length}`
          );
        }
      }

      // Sanitize route parameters
      if (request.params && typeof request.params === 'object') {
        const paramsResult = this.sanitizationService.sanitizeInput(request.params, strictOptions);
        request.params = paramsResult.sanitized;

        if (paramsResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.api.params.violations',
              violations: paramsResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `API params sanitization violations: ${paramsResult.violations.length}`
          );
        }
      }

      const processingTime = Date.now() - startTime;

      this.logger.debug(
        {
          event: 'input.sanitization.api.completed',
          url: request.url,
          method: request.method,
          processingTime,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        `API input sanitization completed in ${processingTime}ms`
      );

      return next.handle();
    } catch (error) {
      this.logger.error(
        {
          event: 'input.sanitization.api.error',
          error: error.message,
          url: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        'API input sanitization failed'
      );

      throw new BadRequestException('Invalid input data');
    }
  }
}

/**
 * Interceptor for file upload endpoints with specialized sanitization
 */
@Injectable()
export class FileUploadSanitizationInterceptor implements NestInterceptor {
  constructor(
    private sanitizationService: InputSanitizationService,
    private logger: PinoLoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    try {
      // Sanitize file metadata
      if (request.body && typeof request.body === 'object') {
        // Remove any potentially dangerous fields from file metadata
        const sanitizedBody = { ...request.body };
        
        // Sanitize filename
        if (sanitizedBody.filename) {
          const filenameResult = this.sanitizationService.sanitizeInput(sanitizedBody.filename, {
            stripHtml: true,
            escapeHtml: true,
            normalizeWhitespace: true,
            removeNullBytes: true,
            maxLength: 255,
            allowedTags: [],
            allowedAttributes: {},
            forbiddenTags: ['script', 'iframe', 'object', 'embed'],
            forbiddenAttributes: ['onclick', 'onload', 'onerror'],
          });
          
          sanitizedBody.filename = filenameResult.sanitized;
          
          if (filenameResult.violations.length > 0) {
            this.logger.warn(
              {
                event: 'input.sanitization.file.filename.violations',
                violations: filenameResult.violations,
                url: request.url,
                method: request.method,
                ip: request.ip,
                userAgent: request.get('User-Agent'),
              },
              `Filename sanitization violations: ${filenameResult.violations.length}`
            );
          }
        }

        // Sanitize description
        if (sanitizedBody.description) {
          const descriptionResult = this.sanitizationService.sanitizeInput(sanitizedBody.description, {
            stripHtml: true,
            escapeHtml: true,
            normalizeWhitespace: true,
            removeNullBytes: true,
            maxLength: 1000,
            allowedTags: [],
            allowedAttributes: {},
            forbiddenTags: ['script', 'iframe', 'object', 'embed'],
            forbiddenAttributes: ['onclick', 'onload', 'onerror'],
          });
          
          sanitizedBody.description = descriptionResult.sanitized;
          
          if (descriptionResult.violations.length > 0) {
            this.logger.warn(
              {
                event: 'input.sanitization.file.description.violations',
                violations: descriptionResult.violations,
                url: request.url,
                method: request.method,
                ip: request.ip,
                userAgent: request.get('User-Agent'),
              },
              `Description sanitization violations: ${descriptionResult.violations.length}`
            );
          }
        }

        request.body = sanitizedBody;
      }

      // Sanitize query parameters
      if (request.query && typeof request.query === 'object') {
        const queryResult = this.sanitizationService.sanitizeInput(request.query, {
          stripHtml: true,
          escapeHtml: true,
          normalizeWhitespace: true,
          removeNullBytes: true,
          maxLength: 1000,
          allowedTags: [],
          allowedAttributes: {},
          forbiddenTags: ['script', 'iframe', 'object', 'embed'],
          forbiddenAttributes: ['onclick', 'onload', 'onerror'],
        });
        
        request.query = queryResult.sanitized;

        if (queryResult.violations.length > 0) {
          this.logger.warn(
            {
              event: 'input.sanitization.file.query.violations',
              violations: queryResult.violations,
              url: request.url,
              method: request.method,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
            },
            `File query sanitization violations: ${queryResult.violations.length}`
          );
        }
      }

      const processingTime = Date.now() - startTime;

      this.logger.debug(
        {
          event: 'input.sanitization.file.completed',
          url: request.url,
          method: request.method,
          processingTime,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        `File upload input sanitization completed in ${processingTime}ms`
      );

      return next.handle();
    } catch (error) {
      this.logger.error(
        {
          event: 'input.sanitization.file.error',
          error: error.message,
          url: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
        },
        'File upload input sanitization failed'
      );

      throw new BadRequestException('Invalid file upload data');
    }
  }
}
