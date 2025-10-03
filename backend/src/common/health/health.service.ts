import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';
import { RedisService } from '../redis/redis.service';
import { DataSource } from 'typeorm';
import { MemoryService } from '../memory/memory.service';
import { CacheService } from '../cache/cache.service';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  timestamp: Date;
  duration: number;
  details?: any;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export interface DetailedHealthStatus extends HealthStatus {
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  services: {
    database: HealthCheck;
    redis: HealthCheck;
    cache: HealthCheck;
    memory: HealthCheck;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private readonly version: string;
  private readonly environment: string;

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
    private redisService: RedisService,
    private dataSource: DataSource,
    private memoryService: MemoryService,
    private cacheService: CacheService,
  ) {
    this.version = this.configService.get<string>('APP_VERSION', '1.0.0');
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
  }

  /**
   * Get basic health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // Database health check
    checks.push(await this.checkDatabase());

    // Redis health check
    checks.push(await this.checkRedis());

    // Cache health check
    checks.push(await this.checkCache());

    // Memory health check
    checks.push(await this.checkMemory());

    // Calculate overall status
    const summary = this.calculateSummary(checks);
    const overallStatus = this.determineOverallStatus(summary);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment,
      checks,
      summary,
    };
  }

  /**
   * Get detailed health status
   */
  async getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
    const basicHealth = await this.getHealthStatus();
    
    // Get system information
    const systemInfo = await this.getSystemInfo();
    
    // Get services health
    const services = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      cache: await this.checkCache(),
      memory: await this.checkMemory(),
    };

    // Get performance metrics
    const performance = await this.getPerformanceMetrics();

    return {
      ...basicHealth,
      system: systemInfo,
      services,
      performance,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      
      // Check database version
      const version = await this.dataSource.query('SELECT version()');
      
      // Check active connections
      const connections = await this.dataSource.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);

      const duration = Date.now() - startTime;

      return {
        name: 'database',
        status: 'healthy',
        message: 'Database is healthy',
        timestamp: new Date(),
        duration,
        details: {
          version: version[0]?.version,
          activeConnections: connections[0]?.active_connections,
          type: this.dataSource.options.type,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Database health check failed:', error);
      
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database health check failed: ${error.message}`,
        timestamp: new Date(),
        duration,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      if (!this.redisService.isEnabled()) {
        return {
          name: 'redis',
          status: 'degraded',
          message: 'Redis is not enabled',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: { enabled: false },
        };
      }

      // Test Redis connection
      const pingResult = await this.redisService.ping();
      
      if (!pingResult) {
        throw new Error('Redis ping failed');
      }

      // Get Redis info
      const info = await this.redisService.get('health_check');
      await this.redisService.setex('health_check', 10, 'ok');

      const duration = Date.now() - startTime;

      return {
        name: 'redis',
        status: 'healthy',
        message: 'Redis is healthy',
        timestamp: new Date(),
        duration,
        details: {
          ping: pingResult,
          enabled: true,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Redis health check failed:', error);
      
      return {
        name: 'redis',
        status: 'unhealthy',
        message: `Redis health check failed: ${error.message}`,
        timestamp: new Date(),
        duration,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCache(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test cache service
      const isHealthy = await this.cacheService.healthCheck();
      
      if (!isHealthy) {
        throw new Error('Cache service is not healthy');
      }

      // Get cache stats
      const stats = this.cacheService.getStats();
      const hitRatio = this.cacheService.getHitRatio();

      const duration = Date.now() - startTime;

      return {
        name: 'cache',
        status: 'healthy',
        message: 'Cache is healthy',
        timestamp: new Date(),
        duration,
        details: {
          stats,
          hitRatio,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Cache health check failed:', error);
      
      return {
        name: 'cache',
        status: 'unhealthy',
        message: `Cache health check failed: ${error.message}`,
        timestamp: new Date(),
        duration,
        details: { error: error.message },
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test memory service
      const isHealthy = await this.memoryService.healthCheck();
      
      if (!isHealthy) {
        throw new Error('Memory service is not healthy');
      }

      // Get memory health
      const memoryHealth = this.memoryService.getMemoryHealth();

      const duration = Date.now() - startTime;

      return {
        name: 'memory',
        status: memoryHealth.status === 'healthy' ? 'healthy' : 'degraded',
        message: `Memory is ${memoryHealth.status}`,
        timestamp: new Date(),
        duration,
        details: {
          status: memoryHealth.status,
          usage: memoryHealth.usagePercentage,
          stats: memoryHealth.stats,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Memory health check failed:', error);
      
      return {
        name: 'memory',
        status: 'unhealthy',
        message: `Memory health check failed: ${error.message}`,
        timestamp: new Date(),
        duration,
        details: { error: error.message },
      };
    }
  }

  /**
   * Get system information
   */
  private async getSystemInfo(): Promise<DetailedHealthStatus['system']> {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        usage: await this.getCPUUsage(),
      },
      disk: {
        used: await this.getDiskUsage(),
        total: await this.getDiskTotal(),
        percentage: await this.getDiskUsagePercentage(),
      },
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<DetailedHealthStatus['performance']> {
    // This would typically come from a metrics service
    return {
      responseTime: 150, // ms
      throughput: 1000, // requests per minute
      errorRate: 0.5, // percentage
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(checks: HealthCheck[]): HealthStatus['summary'] {
    const summary = {
      total: checks.length,
      healthy: 0,
      unhealthy: 0,
      degraded: 0,
    };

    for (const check of checks) {
      switch (check.status) {
        case 'healthy':
          summary.healthy++;
          break;
        case 'unhealthy':
          summary.unhealthy++;
          break;
        case 'degraded':
          summary.degraded++;
          break;
      }
    }

    return summary;
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(summary: HealthStatus['summary']): 'healthy' | 'unhealthy' | 'degraded' {
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    }
    
    if (summary.degraded > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Get CPU usage (simplified)
   */
  private async getCPUUsage(): Promise<number> {
    // This is a simplified implementation
    // In production, you might want to use a more sophisticated approach
    return Math.random() * 100;
  }

  /**
   * Get disk usage (simplified)
   */
  private async getDiskUsage(): Promise<number> {
    // This is a simplified implementation
    return 1024 * 1024 * 1024; // 1GB
  }

  /**
   * Get disk total (simplified)
   */
  private async getDiskTotal(): Promise<number> {
    // This is a simplified implementation
    return 10 * 1024 * 1024 * 1024; // 10GB
  }

  /**
   * Get disk usage percentage (simplified)
   */
  private async getDiskUsagePercentage(): Promise<number> {
    const used = await this.getDiskUsage();
    const total = await this.getDiskTotal();
    return Math.round((used / total) * 100);
  }

  /**
   * Get readiness status
   */
  async getReadinessStatus(): Promise<{ ready: boolean; checks: HealthCheck[] }> {
    const checks = [
      await this.checkDatabase(),
      await this.checkRedis(),
    ];

    const ready = checks.every(check => check.status === 'healthy');

    return { ready, checks };
  }

  /**
   * Get liveness status
   */
  async getLivenessStatus(): Promise<{ alive: boolean; uptime: number }> {
    const uptime = Date.now() - this.startTime;
    const alive = uptime > 0; // Simple liveness check

    return { alive, uptime };
  }

  /**
   * Health check for specific service
   */
  async checkService(serviceName: string): Promise<HealthCheck> {
    switch (serviceName) {
      case 'database':
        return this.checkDatabase();
      case 'redis':
        return this.checkRedis();
      case 'cache':
        return this.checkCache();
      case 'memory':
        return this.checkMemory();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Get health check configuration
   */
  getHealthConfig(): {
    enabled: boolean;
    timeout: number;
    interval: number;
    retries: number;
  } {
    return {
      enabled: this.configService.get<boolean>('HEALTH_CHECK_ENABLED', true),
      timeout: this.configService.get<number>('HEALTH_CHECK_TIMEOUT', 5000),
      interval: this.configService.get<number>('HEALTH_CHECK_INTERVAL', 30000),
      retries: this.configService.get<number>('HEALTH_CHECK_RETRIES', 3),
    };
  }
}
