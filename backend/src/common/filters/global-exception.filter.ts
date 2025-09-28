// Global exception filter (single copy, LF normalized)
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ErrorCode } from '../errors/error-codes.enum';
import { PinoLoggerService } from '../logging/pino-logger.service';
import { MetricsService } from '../../observability/metrics.service';

interface StandardErrorBody {
  error: string;
  message: string;
  statusCode: number;
  code: ErrorCode;
  timestamp: string;
  path: string;
}

function mapStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.VALIDATION_ERROR;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly metrics?: MetricsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'InternalServerError';
    let message: string | string[] = 'Internal server error';
    let explicitCode: ErrorCode | undefined;

    // Special handling for throttling BEFORE generic branch
    if (exception instanceof ThrottlerException) {
      const retryAfter = 60; // static window; could be derived
      try {
        if (!response.getHeader('Retry-After')) response.setHeader('Retry-After', retryAfter);
      } catch {}
      try {
        this.metrics?.incRateLimit(request.route?.path || request.originalUrl || 'unknown');
      } catch {}
      const body: StandardErrorBody & { retryAfter: number | string } = {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        statusCode: 429,
        code: ErrorCode.INTERNAL_ERROR, // separate code map if desired later
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
        retryAfter: response.getHeader('Retry-After') || retryAfter,
      } as any;
      this.logger.error({ event: 'request.error', ...body, stack: (exception as any)?.stack });
      return response.status(429).json(body);
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      if (typeof res === 'string') {
        message = res;
      } else if (Array.isArray(res?.message)) {
        message = res.message.join(', ');
      } else if (res?.message) {
        message = res.message;
      } else if ((exception as any).message) {
        message = (exception as any).message;
      }
      errorName = res?.error || (exception as any).name || errorName;
      if (res?.code && Object.values(ErrorCode).includes(res.code)) {
        explicitCode = res.code as ErrorCode;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errorName = exception.name || errorName;
    }

    const code = explicitCode || mapStatusToErrorCode(status);

    const body: StandardErrorBody = {
      error: errorName,
      message: Array.isArray(message) ? message.join(', ') : message,
      statusCode: status,
      code,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    this.logger.error({
      event: 'request.error',
      ...body,
      correlationId: (request as any).correlationId,
      stack: (exception as any)?.stack,
    });

    response.status(status).json(body);
  }
}
