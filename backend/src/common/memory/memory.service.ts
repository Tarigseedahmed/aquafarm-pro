import { Injectable, Logger } from '@nestjs/common';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface MemoryStats {
  rss: number; // Resident Set Size
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  max: number; // MB
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'max';
  current: number;
  threshold: number;
  timestamp: Date;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private thresholds: MemoryThresholds = {
    warning: 512, // 512 MB
    critical: 768, // 768 MB
    max: 1024, // 1 GB
  };
  
  private memoryAlerts: MemoryAlert[] = [];
  private readonly maxAlertsHistory = 100;
  private gcInterval: NodeJS.Timeout | null = null;

  constructor(private pinoLogger: PinoLoggerService) {
    this.startMemoryMonitoring();
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    
    return {
      rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
    };
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsagePercentage(): number {
    const stats = this.getMemoryStats();
    return (stats.heapUsed / stats.heapTotal) * 100;
  }

  /**
   * Check if memory usage is within acceptable limits
   */
  isMemoryUsageAcceptable(): boolean {
    const stats = this.getMemoryStats();
    return stats.heapUsed < this.thresholds.warning;
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc && typeof global.gc === 'function') {
      try {
        global.gc();
        this.logger.debug('Forced garbage collection');
        return true;
      } catch (error) {
        this.logger.error('Failed to force garbage collection:', error);
        return false;
      }
    } else {
      this.logger.warn('Garbage collection not available (start with --expose-gc flag)');
      return false;
    }
  }

  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    this.gcInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    this.logger.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
      this.logger.log('Memory monitoring stopped');
    }
  }

  /**
   * Check memory usage and trigger alerts if necessary
   */
  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    const usagePercentage = this.getMemoryUsagePercentage();

    // Check for memory alerts
    if (stats.heapUsed >= this.thresholds.max) {
      this.triggerMemoryAlert('max', stats.heapUsed, this.thresholds.max);
    } else if (stats.heapUsed >= this.thresholds.critical) {
      this.triggerMemoryAlert('critical', stats.heapUsed, this.thresholds.critical);
    } else if (stats.heapUsed >= this.thresholds.warning) {
      this.triggerMemoryAlert('warning', stats.heapUsed, this.thresholds.warning);
    }

    // Log memory stats periodically
    this.logger.debug(
      `Memory usage: ${stats.heapUsed}MB / ${stats.heapTotal}MB (${usagePercentage.toFixed(1)}%)`
    );
  }

  /**
   * Trigger memory alert
   */
  private triggerMemoryAlert(
    type: 'warning' | 'critical' | 'max',
    current: number,
    threshold: number,
  ): void {
    const alert: MemoryAlert = {
      type,
      current,
      threshold,
      timestamp: new Date(),
    };

    this.memoryAlerts.push(alert);

    // Keep only recent alerts
    if (this.memoryAlerts.length > this.maxAlertsHistory) {
      this.memoryAlerts = this.memoryAlerts.slice(-this.maxAlertsHistory);
    }

    // Log alert
    this.pinoLogger.warn(
      {
        event: 'memory.alert',
        type,
        current,
        threshold,
        usage: this.getMemoryUsagePercentage(),
      },
      `Memory ${type} alert: ${current}MB used (threshold: ${threshold}MB)`
    );

    // Take action based on alert type
    switch (type) {
      case 'warning':
        // Log warning, no action needed
        break;
      case 'critical':
        // Try to force garbage collection
        this.forceGarbageCollection();
        break;
      case 'max':
        // Critical situation - force GC and log error
        this.forceGarbageCollection();
        this.logger.error('Maximum memory usage reached!');
        break;
    }
  }

  /**
   * Get memory alerts history
   */
  getMemoryAlerts(): MemoryAlert[] {
    return [...this.memoryAlerts];
  }

  /**
   * Clear memory alerts history
   */
  clearMemoryAlerts(): void {
    this.memoryAlerts = [];
  }

  /**
   * Set memory thresholds
   */
  setMemoryThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.logger.log(`Memory thresholds updated: ${JSON.stringify(this.thresholds)}`);
  }

  /**
   * Get memory thresholds
   */
  getMemoryThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }

  /**
   * Get memory health status
   */
  getMemoryHealth(): {
    status: 'healthy' | 'warning' | 'critical' | 'max';
    stats: MemoryStats;
    usagePercentage: number;
    alerts: MemoryAlert[];
  } {
    const stats = this.getMemoryStats();
    const usagePercentage = this.getMemoryUsagePercentage();
    
    let status: 'healthy' | 'warning' | 'critical' | 'max' = 'healthy';
    
    if (stats.heapUsed >= this.thresholds.max) {
      status = 'max';
    } else if (stats.heapUsed >= this.thresholds.critical) {
      status = 'critical';
    } else if (stats.heapUsed >= this.thresholds.warning) {
      status = 'warning';
    }

    return {
      status,
      stats,
      usagePercentage,
      alerts: this.getMemoryAlerts(),
    };
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): {
    before: MemoryStats;
    after: MemoryStats;
    freed: number;
    success: boolean;
  } {
    const before = this.getMemoryStats();
    const success = this.forceGarbageCollection();
    const after = this.getMemoryStats();
    const freed = before.heapUsed - after.heapUsed;

    this.logger.log(
      `Memory optimization: ${freed}MB freed (${before.heapUsed}MB -> ${after.heapUsed}MB)`
    );

    return {
      before,
      after,
      freed,
      success,
    };
  }

  /**
   * Get memory leak detection info
   */
  detectMemoryLeaks(): {
    hasLeaks: boolean;
    growthRate: number;
    recommendations: string[];
  } {
    const alerts = this.getMemoryAlerts();
    const recentAlerts = alerts.filter(
      alert => alert.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    const hasLeaks = recentAlerts.length > 3;
    const growthRate = this.calculateMemoryGrowthRate();
    
    const recommendations: string[] = [];
    
    if (hasLeaks) {
      recommendations.push('Investigate potential memory leaks');
      recommendations.push('Review object lifecycle management');
      recommendations.push('Check for unclosed streams or connections');
    }
    
    if (growthRate > 10) {
      recommendations.push('High memory growth rate detected');
      recommendations.push('Consider implementing memory pooling');
    }

    return {
      hasLeaks,
      growthRate,
      recommendations,
    };
  }

  /**
   * Calculate memory growth rate (MB per minute)
   */
  private calculateMemoryGrowthRate(): number {
    const alerts = this.getMemoryAlerts();
    if (alerts.length < 2) return 0;

    const sortedAlerts = alerts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const first = sortedAlerts[0];
    const last = sortedAlerts[sortedAlerts.length - 1];
    
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime();
    const memoryDiff = last.current - first.current;
    
    return timeDiff > 0 ? (memoryDiff / timeDiff) * 60000 : 0; // MB per minute
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const health = this.getMemoryHealth();
      return health.status !== 'max';
    } catch (error) {
      this.logger.error('Memory health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    this.stopMemoryMonitoring();
  }
}
