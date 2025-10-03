import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface CounterMetric extends MetricData {
  type: 'counter';
  increment: number;
}

export interface GaugeMetric extends MetricData {
  type: 'gauge';
  set: number;
}

export interface HistogramMetric extends MetricData {
  type: 'histogram';
  observe: number;
  buckets?: number[];
}

export interface SummaryMetric extends MetricData {
  type: 'summary';
  observe: number;
  quantiles?: number[];
}

export interface MetricsSnapshot {
  timestamp: Date;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, {
    count: number;
    sum: number;
    buckets: Record<string, number>;
  }>;
  summaries: Record<string, {
    count: number;
    sum: number;
    quantiles: Record<string, number>;
  }>;
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRate: {
    percentage: number;
    count: number;
    types: Record<string, number>;
  };
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
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private summaries: Map<string, number[]> = new Map();
  private metricsHistory: MetricsSnapshot[] = [];
  private readonly maxHistorySize = 1000;

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);

    this.logMetric({
      name,
      value: currentValue + value,
      timestamp: new Date(),
      labels,
      type: 'counter',
    } as CounterMetric);
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);

    this.logMetric({
      name,
      value,
      timestamp: new Date(),
      labels,
      type: 'gauge',
    } as GaugeMetric);
  }

  /**
   * Observe a histogram metric
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const currentValues = this.histograms.get(key) || [];
    currentValues.push(value);

    // Keep only recent values (last 1000)
    if (currentValues.length > 1000) {
      currentValues.splice(0, currentValues.length - 1000);
    }

    this.histograms.set(key, currentValues);

    this.logMetric({
      name,
      value,
      timestamp: new Date(),
      labels,
      type: 'histogram',
    } as HistogramMetric);
  }

  /**
   * Observe a summary metric
   */
  observeSummary(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const currentValues = this.summaries.get(key) || [];
    currentValues.push(value);

    // Keep only recent values (last 1000)
    if (currentValues.length > 1000) {
      currentValues.splice(0, currentValues.length - 1000);
    }

    this.summaries.set(key, currentValues);

    this.logMetric({
      name,
      value,
      timestamp: new Date(),
      labels,
      type: 'summary',
    } as SummaryMetric);
  }

  /**
   * Record API request metrics
   */
  recordApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    labels?: Record<string, string>,
  ): void {
    // Record request count
    this.incrementCounter('api_requests_total', 1, {
      method,
      endpoint,
      status: statusCode.toString(),
      ...labels,
    });

    // Record request duration
    this.observeHistogram('api_request_duration_seconds', duration / 1000, {
      method,
      endpoint,
      status: statusCode.toString(),
      ...labels,
    });

    // Record error count if applicable
    if (statusCode >= 400) {
      this.incrementCounter('api_errors_total', 1, {
        method,
        endpoint,
        status: statusCode.toString(),
        ...labels,
      });
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    labels?: Record<string, string>,
  ): void {
    // Record operation count
    this.incrementCounter('database_operations_total', 1, {
      operation,
      table,
      success: success.toString(),
      ...labels,
    });

    // Record operation duration
    this.observeHistogram('database_operation_duration_seconds', duration / 1000, {
      operation,
      table,
      success: success.toString(),
      ...labels,
    });

    // Record error count if applicable
    if (!success) {
      this.incrementCounter('database_errors_total', 1, {
        operation,
        table,
        ...labels,
      });
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(
    operation: string,
    hit: boolean,
    duration: number,
    labels?: Record<string, string>,
  ): void {
    // Record operation count
    this.incrementCounter('cache_operations_total', 1, {
      operation,
      hit: hit.toString(),
      ...labels,
    });

    // Record operation duration
    this.observeHistogram('cache_operation_duration_seconds', duration / 1000, {
      operation,
      hit: hit.toString(),
      ...labels,
    });

    // Record hit rate
    this.setGauge('cache_hit_rate', hit ? 1 : 0, {
      operation,
      ...labels,
    });
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(
    event: string,
    value: number,
    entity?: string,
    labels?: Record<string, string>,
  ): void {
    this.incrementCounter('business_events_total', value, {
      event,
      entity: entity || 'unknown',
      ...labels,
    });
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    // Memory metrics
    this.setGauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap' });
    this.setGauge('memory_total_bytes', memUsage.heapTotal, { type: 'heap' });
    this.setGauge('memory_external_bytes', memUsage.external, { type: 'external' });
    
    // Process metrics
    this.setGauge('process_uptime_seconds', process.uptime());
    this.setGauge('process_cpu_usage_percent', this.getCPUUsage());
  }

  /**
   * Get metrics snapshot
   */
  getMetricsSnapshot(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      counters: {},
      gauges: {},
      histograms: {},
      summaries: {},
    };

    // Collect counters
    for (const [key, value] of this.counters.entries()) {
      snapshot.counters[key] = value;
    }

    // Collect gauges
    for (const [key, value] of this.gauges.entries()) {
      snapshot.gauges[key] = value;
    }

    // Collect histograms
    for (const [key, values] of this.histograms.entries()) {
      if (values.length > 0) {
        snapshot.histograms[key] = {
          count: values.length,
          sum: values.reduce((sum, val) => sum + val, 0),
          buckets: this.calculateHistogramBuckets(values),
        };
      }
    }

    // Collect summaries
    for (const [key, values] of this.summaries.entries()) {
      if (values.length > 0) {
        snapshot.summaries[key] = {
          count: values.length,
          sum: values.reduce((sum, val) => sum + val, 0),
          quantiles: this.calculateQuantiles(values),
        };
      }
    }

    return snapshot;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const snapshot = this.getMetricsSnapshot();
    
    // Calculate response time metrics
    const responseTimeValues = this.histograms.get('api_request_duration_seconds') || [];
    const responseTime = this.calculateResponseTimeMetrics(responseTimeValues);
    
    // Calculate throughput metrics
    const throughput = this.calculateThroughputMetrics();
    
    // Calculate error rate
    const errorRate = this.calculateErrorRate(snapshot);
    
    // Get system metrics
    const system = this.getSystemMetrics();

    return {
      responseTime,
      throughput,
      errorRate,
      system,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const snapshot = this.getMetricsSnapshot();
    let output = '';

    // Export counters
    for (const [name, value] of Object.entries(snapshot.counters)) {
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${value}\n`;
    }

    // Export gauges
    for (const [name, value] of Object.entries(snapshot.gauges)) {
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n`;
    }

    // Export histograms
    for (const [name, data] of Object.entries(snapshot.histograms)) {
      output += `# TYPE ${name} histogram\n`;
      output += `${name}_count ${data.count}\n`;
      output += `${name}_sum ${data.sum}\n`;
      
      for (const [bucket, count] of Object.entries(data.buckets)) {
        output += `${name}_bucket{le="${bucket}"} ${count}\n`;
      }
    }

    // Export summaries
    for (const [name, data] of Object.entries(snapshot.summaries)) {
      output += `# TYPE ${name} summary\n`;
      output += `${name}_count ${data.count}\n`;
      output += `${name}_sum ${data.sum}\n`;
      
      for (const [quantile, value] of Object.entries(data.quantiles)) {
        output += `${name}{quantile="${quantile}"} ${value}\n`;
      }
    }

    return output;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    this.metricsHistory = [];
    
    this.logger.log('All metrics have been reset');
  }

  /**
   * Get metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) {
      return name;
    }
    
    const labelString = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `${name}{${labelString}}`;
  }

  /**
   * Log metric data
   */
  private logMetric(metric: MetricData): void {
    this.pinoLogger.debug(
      {
        event: 'metric.recorded',
        name: metric.name,
        value: metric.value,
        type: metric.type,
        labels: metric.labels,
      },
      `Metric recorded: ${metric.name} = ${metric.value}`
    );
  }

  /**
   * Calculate histogram buckets
   */
  private calculateHistogramBuckets(values: number[]): Record<string, number> {
    const buckets = {
      '0.005': 0,
      '0.01': 0,
      '0.025': 0,
      '0.05': 0,
      '0.075': 0,
      '0.1': 0,
      '0.25': 0,
      '0.5': 0,
      '0.75': 0,
      '1': 0,
      '2.5': 0,
      '5': 0,
      '7.5': 0,
      '10': 0,
      '+Inf': 0,
    };

    for (const value of values) {
      for (const [bucket, count] of Object.entries(buckets)) {
        if (bucket === '+Inf' || value <= parseFloat(bucket)) {
          buckets[bucket] = count + 1;
          break;
        }
      }
    }

    return buckets;
  }

  /**
   * Calculate quantiles
   */
  private calculateQuantiles(values: number[]): Record<string, number> {
    const sortedValues = [...values].sort((a, b) => a - b);
    const quantiles = {
      '0.5': 0,
      '0.9': 0,
      '0.95': 0,
      '0.99': 0,
    };

    for (const [quantile, value] of Object.entries(quantiles)) {
      const index = Math.ceil(sortedValues.length * parseFloat(quantile)) - 1;
      quantiles[quantile] = sortedValues[Math.max(0, index)];
    }

    return quantiles;
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(values: number[]): PerformanceMetrics['responseTime'] {
    if (values.length === 0) {
      return {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
      };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p50 = sortedValues[Math.floor(sortedValues.length * 0.5)];
    const p95 = sortedValues[Math.floor(sortedValues.length * 0.95)];
    const p99 = sortedValues[Math.floor(sortedValues.length * 0.99)];
    const max = Math.max(...values);

    return {
      average,
      p50,
      p95,
      p99,
      max,
    };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(): PerformanceMetrics['throughput'] {
    const now = Date.now();
    const lastMinute = now - 60 * 1000;
    const lastHour = now - 60 * 60 * 1000;
    
    // This is a simplified calculation
    // In production, you'd want to track timestamps of requests
    const requestsPerSecond = 10; // Placeholder
    const requestsPerMinute = requestsPerSecond * 60;
    const requestsPerHour = requestsPerMinute * 60;

    return {
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
    };
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(snapshot: MetricsSnapshot): PerformanceMetrics['errorRate'] {
    const totalRequests = snapshot.counters['api_requests_total'] || 0;
    const totalErrors = snapshot.counters['api_errors_total'] || 0;
    
    const percentage = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    return {
      percentage,
      count: totalErrors,
      types: {}, // Would need to track error types
    };
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): PerformanceMetrics['system'] {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        usage: this.getCPUUsage(),
      },
      disk: {
        used: 0, // Would need to implement disk usage
        total: 0,
        percentage: 0,
      },
    };
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCPUUsage(): number {
    // This is a simplified implementation
    return Math.random() * 100;
  }

  /**
   * Get metrics configuration
   */
  getMetricsConfig(): {
    enabled: boolean;
    collectionInterval: number;
    retentionPeriod: number;
    exportFormat: string;
  } {
    return {
      enabled: this.configService.get<boolean>('METRICS_ENABLED', true),
      collectionInterval: this.configService.get<number>('METRICS_COLLECTION_INTERVAL', 60000),
      retentionPeriod: this.configService.get<number>('METRICS_RETENTION_PERIOD', 7),
      exportFormat: this.configService.get<string>('METRICS_EXPORT_FORMAT', 'prometheus'),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const snapshot = this.getMetricsSnapshot();
      const config = this.getMetricsConfig();
      
      this.logger.debug(
        `Metrics health check: ${Object.keys(snapshot.counters).length} counters, ${Object.keys(snapshot.gauges).length} gauges`
      );
      
      return config.enabled;
    } catch (error) {
      this.logger.error('Metrics health check failed:', error);
      return false;
    }
  }
}
