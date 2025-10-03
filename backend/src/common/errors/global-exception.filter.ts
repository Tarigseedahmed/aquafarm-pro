import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';
import { EnhancedErrorHandlingService } from './enhanced-error-handling.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
    private errorHandlingService: EnhancedErrorHandlingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract error information
    const error = this.extractError(exception);
    const status = this.extractStatus(exception);
    
    // Create error context
    const context = this.createErrorContext(request, error);
    
    // Handle error through enhanced error handling service
    const errorReport = this.errorHandlingService.handleError(error, context);
    
    // Generate user-friendly response
    const userResponse = this.errorHandlingService.generateUserErrorResponse(error, context);
    
    // Log error
    this.logError(error, status, request, errorReport);
    
    // Send response
    response.status(status).json(userResponse);
  }

  /**
   * Extract error from exception
   */
  private extractError(exception: unknown): Error {
    if (exception instanceof Error) {
      return exception;
    }
    
    if (typeof exception === 'string') {
      return new Error(exception);
    }
    
    return new Error('Unknown error occurred');
  }

  /**
   * Extract HTTP status from exception
   */
  private extractStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    
    // Default to internal server error for unknown exceptions
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Create error context from request
   */
  private createErrorContext(request: Request, error: Error): any {
    return {
      requestId: request.headers['x-request-id'] || this.generateRequestId(),
      correlationId: request.headers['x-correlation-id'],
      endpoint: request.url,
      method: request.method,
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
      tenantId: request.headers['x-tenant-id'],
      metadata: {
        query: request.query,
        params: request.params,
        body: this.sanitizeRequestBody(request.body),
        headers: this.sanitizeHeaders(request.headers),
      },
    };
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: Error, status: number, request: Request, errorReport: any): void {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const logLevel = this.getLogLevel(status);
    
    const logData = {
      event: 'http.error',
      errorId: errorReport.id,
      status,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      userId: (request as any).user?.id,
      tenantId: request.headers['x-tenant-id'],
      requestId: request.headers['x-request-id'],
      correlationId: request.headers['x-correlation-id'],
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      },
      classification: errorReport.classification,
    };

    switch (logLevel) {
      case 'fatal':
        this.pinoLogger.fatal(logData, `HTTP ${status} Error: ${error.message}`);
        break;
      case 'error':
        this.pinoLogger.error(logData, `HTTP ${status} Error: ${error.message}`);
        break;
      case 'warn':
        this.pinoLogger.warn(logData, `HTTP ${status} Error: ${error.message}`);
        break;
      case 'info':
        this.pinoLogger.info(logData, `HTTP ${status} Error: ${error.message}`);
        break;
      default:
        this.pinoLogger.debug(logData, `HTTP ${status} Error: ${error.message}`);
    }
  }

  /**
   * Get log level based on HTTP status
   */
  private getLogLevel(status: number): 'fatal' | 'error' | 'warn' | 'info' | 'debug' {
    if (status >= 500) {
      return 'error';
    }
    
    if (status >= 400) {
      return 'warn';
    }
    
    return 'info';
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
