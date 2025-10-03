import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';
import { MetricsService } from '../metrics/metrics.service';

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  correlationId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

export interface ErrorClassification {
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'conflict' | 'rate_limit' | 'server' | 'external' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user_error' | 'system_error' | 'external_error';
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
  errorCode: string;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  classification: ErrorClassification;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  assignedTo?: string;
  tags?: string[];
}

@Injectable()
export class EnhancedErrorHandlingService {
  private readonly logger = new Logger(EnhancedErrorHandlingService.name);
  private errorReports: Map<string, ErrorReport> = new Map();
  private readonly maxErrorHistory = 10000;

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
    private metricsService: MetricsService,
  ) {}

  /**
   * Handle and classify an error
   */
  handleError(error: Error, context: ErrorContext = {}): ErrorReport {
    const errorReport = this.createErrorReport(error, context);
    
    // Store error report
    this.storeErrorReport(errorReport);
    
    // Log error
    this.logError(errorReport);
    
    // Record metrics
    this.recordErrorMetrics(errorReport);
    
    // Check for alerting
    this.checkForAlerting(errorReport);
    
    return errorReport;
  }

  /**
   * Create error report
   */
  private createErrorReport(error: Error, context: ErrorContext): ErrorReport {
    const classification = this.classifyError(error);
    
    return {
      id: this.generateErrorId(),
      error,
      context: {
        ...context,
        timestamp: new Date(),
        stack: error.stack,
      },
      classification,
      timestamp: new Date(),
      resolved: false,
    };
  }

  /**
   * Classify error type and severity
   */
  private classifyError(error: Error): ErrorClassification {
    const errorName = error.constructor.name;
    const errorMessage = error.message.toLowerCase();
    
    // Validation errors
    if (errorName === 'ValidationError' || errorMessage.includes('validation')) {
      return {
        type: 'validation',
        severity: 'low',
        category: 'user_error',
        retryable: false,
        userMessage: 'Please check your input and try again',
        technicalMessage: error.message,
        errorCode: 'VALIDATION_ERROR',
      };
    }
    
    // Authentication errors
    if (errorName === 'UnauthorizedException' || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return {
        type: 'authentication',
        severity: 'medium',
        category: 'user_error',
        retryable: false,
        userMessage: 'Authentication required',
        technicalMessage: error.message,
        errorCode: 'AUTH_ERROR',
      };
    }
    
    // Authorization errors
    if (errorName === 'ForbiddenException' || errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      return {
        type: 'authorization',
        severity: 'medium',
        category: 'user_error',
        retryable: false,
        userMessage: 'You do not have permission to perform this action',
        technicalMessage: error.message,
        errorCode: 'AUTHZ_ERROR',
      };
    }
    
    // Not found errors
    if (errorName === 'NotFoundException' || errorMessage.includes('not found')) {
      return {
        type: 'not_found',
        severity: 'low',
        category: 'user_error',
        retryable: false,
        userMessage: 'The requested resource was not found',
        technicalMessage: error.message,
        errorCode: 'NOT_FOUND',
      };
    }
    
    // Conflict errors
    if (errorName === 'ConflictException' || errorMessage.includes('conflict') || errorMessage.includes('already exists')) {
      return {
        type: 'conflict',
        severity: 'low',
        category: 'user_error',
        retryable: false,
        userMessage: 'The resource already exists or conflicts with existing data',
        technicalMessage: error.message,
        errorCode: 'CONFLICT_ERROR',
      };
    }
    
    // Rate limit errors
    if (errorName === 'ThrottlerException' || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: 'rate_limit',
        severity: 'low',
        category: 'user_error',
        retryable: true,
        userMessage: 'Too many requests. Please try again later',
        technicalMessage: error.message,
        errorCode: 'RATE_LIMIT',
      };
    }
    
    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return {
        type: 'server',
        severity: 'high',
        category: 'system_error',
        retryable: true,
        userMessage: 'A temporary error occurred. Please try again',
        technicalMessage: error.message,
        errorCode: 'DB_ERROR',
      };
    }
    
    // External service errors
    if (errorMessage.includes('external') || errorMessage.includes('api') || errorMessage.includes('service')) {
      return {
        type: 'external',
        severity: 'medium',
        category: 'external_error',
        retryable: true,
        userMessage: 'An external service is temporarily unavailable',
        technicalMessage: error.message,
        errorCode: 'EXTERNAL_ERROR',
      };
    }
    
    // Default classification
    return {
      type: 'unknown',
      severity: 'high',
      category: 'system_error',
      retryable: false,
      userMessage: 'An unexpected error occurred',
      technicalMessage: error.message,
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Store error report
   */
  private storeErrorReport(errorReport: ErrorReport): void {
    this.errorReports.set(errorReport.id, errorReport);
    
    // Keep only recent errors
    if (this.errorReports.size > this.maxErrorHistory) {
      const oldestError = Array.from(this.errorReports.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      this.errorReports.delete(oldestError.id);
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorReport: ErrorReport): void {
    const { error, context, classification } = errorReport;
    
    const logData = {
      event: 'error.occurred',
      errorId: errorReport.id,
      errorType: classification.type,
      severity: classification.severity,
      category: classification.category,
      errorCode: classification.errorCode,
      message: error.message,
      stack: error.stack,
      context: {
        userId: context.userId,
        tenantId: context.tenantId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        endpoint: context.endpoint,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
      },
      metadata: context.metadata,
    };

    switch (classification.severity) {
      case 'critical':
        this.pinoLogger.fatal(logData, `Critical error: ${error.message}`);
        break;
      case 'high':
        this.pinoLogger.error(logData, `High severity error: ${error.message}`);
        break;
      case 'medium':
        this.pinoLogger.warn(logData, `Medium severity error: ${error.message}`);
        break;
      case 'low':
        this.pinoLogger.info(logData, `Low severity error: ${error.message}`);
        break;
    }
  }

  /**
   * Record error metrics
   */
  private recordErrorMetrics(errorReport: ErrorReport): void {
    const { classification, context } = errorReport;
    
    // Increment error counter
    this.metricsService.incrementCounter('errors_total', 1, {
      type: classification.type,
      severity: classification.severity,
      category: classification.category,
      error_code: classification.errorCode,
    });
    
    // Record error by endpoint
    if (context.endpoint) {
      this.metricsService.incrementCounter('errors_by_endpoint_total', 1, {
        endpoint: context.endpoint,
        method: context.method || 'unknown',
        type: classification.type,
      });
    }
    
    // Record error by user
    if (context.userId) {
      this.metricsService.incrementCounter('errors_by_user_total', 1, {
        user_id: context.userId,
        tenant_id: context.tenantId || 'unknown',
        type: classification.type,
      });
    }
  }

  /**
   * Check for alerting conditions
   */
  private checkForAlerting(errorReport: ErrorReport): void {
    const { classification } = errorReport;
    
    // Alert on critical errors
    if (classification.severity === 'critical') {
      this.pinoLogger.fatal(
        {
          event: 'error.alert.critical',
          errorId: errorReport.id,
          errorType: classification.type,
          errorCode: classification.errorCode,
        },
        `Critical error alert: ${errorReport.error.message}`
      );
    }
    
    // Alert on high severity errors in production
    if (classification.severity === 'high' && this.configService.get('NODE_ENV') === 'production') {
      this.pinoLogger.error(
        {
          event: 'error.alert.high',
          errorId: errorReport.id,
          errorType: classification.type,
          errorCode: classification.errorCode,
        },
        `High severity error alert: ${errorReport.error.message}`
      );
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsByCategory: Record<string, number>;
    recentErrors: ErrorReport[];
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurred: Date;
    }>;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = Array.from(this.errorReports.values())
      .filter(error => error.timestamp >= last24Hours);
    
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};
    const errorCounts: Record<string, { count: number; lastOccurred: Date }> = {};
    
    for (const errorReport of recentErrors) {
      const { classification } = errorReport;
      
      errorsByType[classification.type] = (errorsByType[classification.type] || 0) + 1;
      errorsBySeverity[classification.severity] = (errorsBySeverity[classification.severity] || 0) + 1;
      errorsByCategory[classification.category] = (errorsByCategory[classification.category] || 0) + 1;
      
      const errorKey = errorReport.error.message;
      if (!errorCounts[errorKey]) {
        errorCounts[errorKey] = { count: 0, lastOccurred: errorReport.timestamp };
      }
      errorCounts[errorKey].count++;
      if (errorReport.timestamp > errorCounts[errorKey].lastOccurred) {
        errorCounts[errorKey].lastOccurred = errorReport.timestamp;
      }
    }
    
    const topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurred: data.lastOccurred,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      errorsByCategory,
      recentErrors: recentErrors.slice(0, 100), // Last 100 errors
      topErrors,
    };
  }

  /**
   * Get error by ID
   */
  getErrorById(errorId: string): ErrorReport | null {
    return this.errorReports.get(errorId) || null;
  }

  /**
   * Resolve error
   */
  resolveError(errorId: string, resolution: string, assignedTo?: string): boolean {
    const errorReport = this.errorReports.get(errorId);
    if (!errorReport) {
      return false;
    }
    
    errorReport.resolved = true;
    errorReport.resolution = resolution;
    if (assignedTo) {
      errorReport.assignedTo = assignedTo;
    }
    
    this.pinoLogger.info(
      {
        event: 'error.resolved',
        errorId,
        resolution,
        assignedTo,
      },
      `Error resolved: ${errorId}`
    );
    
    return true;
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .filter(error => !error.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate user-friendly error response
   */
  generateUserErrorResponse(error: Error, context: ErrorContext = {}): {
    error: string;
    message: string;
    code: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  } {
    const classification = this.classifyError(error);
    
    return {
      error: classification.errorCode,
      message: classification.userMessage,
      code: classification.errorCode,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      details: this.configService.get('NODE_ENV') === 'development' ? {
        technicalMessage: classification.technicalMessage,
        stack: error.stack,
      } : undefined,
    };
  }

  /**
   * Generate error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const stats = this.getErrorStatistics();
      const unresolvedErrors = this.getUnresolvedErrors();
      
      this.logger.debug(
        `Error handling health check: ${stats.totalErrors} errors, ${unresolvedErrors.length} unresolved`
      );
      
      return true;
    } catch (error) {
      this.logger.error('Error handling health check failed:', error);
      return false;
    }
  }
}
