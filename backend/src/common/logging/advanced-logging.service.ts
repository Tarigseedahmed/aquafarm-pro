import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from './pino-logger.service';

export interface LogEntry {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: Date;
  context?: string;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByContext: Record<string, number>;
  logsByHour: Record<string, number>;
  errorRate: number;
  averageLogSize: number;
  topErrors: Array<{
    error: string;
    count: number;
    lastOccurred: Date;
  }>;
}

export interface LogQuery {
  level?: string[];
  context?: string[];
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  startDate?: Date;
  endDate?: Date;
  message?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AdvancedLoggingService {
  private readonly logger = new Logger(AdvancedLoggingService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogsHistory = 50000;
  private readonly logRetentionDays = 7;

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Log entry with structured data
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Store in memory for metrics
    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogsHistory) {
      this.logs = this.logs.slice(-this.maxLogsHistory);
    }

    // Log to Pino with structured data
    const pinoData = {
      level: logEntry.level,
      message: logEntry.message,
      context: logEntry.context,
      correlationId: logEntry.correlationId,
      userId: logEntry.userId,
      tenantId: logEntry.tenantId,
      sessionId: logEntry.sessionId,
      requestId: logEntry.requestId,
      ip: logEntry.ip,
      userAgent: logEntry.userAgent,
      metadata: logEntry.metadata,
      error: logEntry.error,
    };

    switch (logEntry.level) {
      case 'trace':
        this.pinoLogger.trace(pinoData, logEntry.message);
        break;
      case 'debug':
        this.pinoLogger.debug(pinoData, logEntry.message);
        break;
      case 'info':
        this.pinoLogger.info(pinoData, logEntry.message);
        break;
      case 'warn':
        this.pinoLogger.warn(pinoData, logEntry.message);
        break;
      case 'error':
        this.pinoLogger.error(pinoData, logEntry.message);
        break;
      case 'fatal':
        this.pinoLogger.fatal(pinoData, logEntry.message);
        break;
    }

    // Clean up old logs periodically
    this.cleanupOldLogs();
  }

  /**
   * Log trace level
   */
  trace(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'trace',
      message,
      context,
      metadata,
    });
  }

  /**
   * Log debug level
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'debug',
      message,
      context,
      metadata,
    });
  }

  /**
   * Log info level
   */
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'info',
      message,
      context,
      metadata,
    });
  }

  /**
   * Log warn level
   */
  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'warn',
      message,
      context,
      metadata,
    });
  }

  /**
   * Log error level
   */
  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'error',
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    });
  }

  /**
   * Log fatal level
   */
  fatal(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: 'fatal',
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    });
  }

  /**
   * Log with correlation ID
   */
  logWithCorrelation(
    level: LogEntry['level'],
    message: string,
    correlationId: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log({
      level,
      message,
      correlationId,
      context,
      metadata,
    });
  }

  /**
   * Log user activity
   */
  logUserActivity(
    userId: string,
    activity: string,
    metadata?: Record<string, any>,
    context?: string,
  ): void {
    this.log({
      level: 'info',
      message: `User activity: ${activity}`,
      context: context || 'user-activity',
      userId,
      metadata: {
        activity,
        ...metadata,
      },
    });
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string,
    tenantId?: string,
    metadata?: Record<string, any>,
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log({
      level,
      message: `API ${method} ${url} ${statusCode}`,
      context: 'api-request',
      requestId,
      userId,
      tenantId,
      metadata: {
        method,
        url,
        statusCode,
        duration,
        ...metadata,
      },
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    affectedRows?: number,
    error?: Error,
    metadata?: Record<string, any>,
  ): void {
    const level = error ? 'error' : 'info';
    const message = error 
      ? `Database ${operation} failed on ${table}`
      : `Database ${operation} on ${table}`;

    this.log({
      level,
      message,
      context: 'database',
      metadata: {
        operation,
        table,
        duration,
        affectedRows,
        ...metadata,
      },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string,
    ip?: string,
    metadata?: Record<string, any>,
  ): void {
    const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    
    this.log({
      level,
      message: `Security event: ${event}`,
      context: 'security',
      userId,
      ip,
      metadata: {
        event,
        severity,
        ...metadata,
      },
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(
    event: string,
    entity: string,
    entityId: string,
    userId?: string,
    tenantId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log({
      level: 'info',
      message: `Business event: ${event}`,
      context: 'business',
      userId,
      tenantId,
      metadata: {
        event,
        entity,
        entityId,
        ...metadata,
      },
    });
  }

  /**
   * Query logs
   */
  queryLogs(query: LogQuery): LogEntry[] {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (query.level && query.level.length > 0) {
      filteredLogs = filteredLogs.filter(log => query.level!.includes(log.level));
    }

    // Filter by context
    if (query.context && query.context.length > 0) {
      filteredLogs = filteredLogs.filter(log => query.context!.includes(log.context || ''));
    }

    // Filter by userId
    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    // Filter by tenantId
    if (query.tenantId) {
      filteredLogs = filteredLogs.filter(log => log.tenantId === query.tenantId);
    }

    // Filter by correlationId
    if (query.correlationId) {
      filteredLogs = filteredLogs.filter(log => log.correlationId === query.correlationId);
    }

    // Filter by date range
    if (query.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= query.endDate!);
    }

    // Filter by message
    if (query.message) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(query.message!.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Get log metrics
   */
  getLogMetrics(): LogMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => log.timestamp >= last24Hours);
    
    const logsByLevel: Record<string, number> = {};
    const logsByContext: Record<string, number> = {};
    const logsByHour: Record<string, number> = {};
    const errors: Record<string, { count: number; lastOccurred: Date }> = {};
    
    let totalSize = 0;

    for (const log of recentLogs) {
      // Count by level
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      
      // Count by context
      const context = log.context || 'unknown';
      logsByContext[context] = (logsByContext[context] || 0) + 1;
      
      // Count by hour
      const hour = log.timestamp.getHours().toString();
      logsByHour[hour] = (logsByHour[hour] || 0) + 1;
      
      // Track errors
      if (log.error) {
        const errorKey = `${log.error.name}: ${log.error.message}`;
        if (!errors[errorKey]) {
          errors[errorKey] = { count: 0, lastOccurred: log.timestamp };
        }
        errors[errorKey].count++;
        if (log.timestamp > errors[errorKey].lastOccurred) {
          errors[errorKey].lastOccurred = log.timestamp;
        }
      }
      
      // Calculate log size
      totalSize += JSON.stringify(log).length;
    }

    const totalLogs = recentLogs.length;
    const errorCount = logsByLevel.error || 0;
    const fatalCount = logsByLevel.fatal || 0;
    const errorRate = totalLogs > 0 ? ((errorCount + fatalCount) / totalLogs) * 100 : 0;

    const topErrors = Object.entries(errors)
      .map(([error, data]) => ({
        error,
        count: data.count,
        lastOccurred: data.lastOccurred,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLogs,
      logsByLevel,
      logsByContext,
      logsByHour,
      errorRate,
      averageLogSize: totalLogs > 0 ? totalSize / totalLogs : 0,
      topErrors,
    };
  }

  /**
   * Clean up old logs
   */
  private cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
  }

  /**
   * Export logs
   */
  exportLogs(query: LogQuery): {
    logs: LogEntry[];
    exportedAt: Date;
    totalCount: number;
    query: LogQuery;
  } {
    const logs = this.queryLogs(query);
    
    return {
      logs,
      exportedAt: new Date(),
      totalCount: logs.length,
      query,
    };
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig(): {
    enabled: boolean;
    level: string;
    retention: number;
    maxHistory: number;
    format: string;
  } {
    return {
      enabled: this.configService.get<boolean>('LOGGING_ENABLED', true),
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      retention: this.logRetentionDays,
      maxHistory: this.maxLogsHistory,
      format: this.configService.get<string>('LOG_FORMAT', 'json'),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const metrics = this.getLogMetrics();
      const config = this.getLoggingConfig();
      
      this.logger.debug(
        `Advanced logging health check: ${metrics.totalLogs} logs, ${metrics.errorRate.toFixed(2)}% error rate`
      );
      
      return config.enabled;
    } catch (error) {
      this.logger.error('Advanced logging health check failed:', error);
      return false;
    }
  }
}
