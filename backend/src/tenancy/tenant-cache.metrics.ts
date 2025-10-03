import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Counter, Gauge, register as globalRegistry } from 'prom-client';
import { TenantCodeCacheService } from './tenant-code-cache.service';

/**
 * Periodically exports in‑memory tenant code cache statistics as Prometheus metrics.
 * Lightweight and non-critical: if anything fails, it degrades silently without affecting the app.
 */
@Injectable()
export class TenantCacheMetricsExporter implements OnModuleInit, OnModuleDestroy {
  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;
  private entriesGauge: Gauge | undefined;
  private hitsCounter: Counter | undefined;
  private missesCounter: Counter | undefined;
  private lastHits = 0;
  private lastMisses = 0;

  constructor(private readonly cache: TenantCodeCacheService) {
    const raw = process.env.TENANT_CACHE_METRICS_INTERVAL_MS || '60000';
    const parsed = parseInt(raw, 10);
    this.intervalMs = Number.isFinite(parsed) && parsed >= 5000 ? parsed : 60000;
  }

  onModuleInit() {
    this.ensureMetrics();
    // First collection immediately so values appear fast in /metrics
    this.collect();
    this.intervalHandle = setInterval(() => this.collectSafe(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private ensureMetrics() {
    // Reuse existing metrics if already created (hot reload / multiple module inits)
    this.entriesGauge =
      (globalRegistry.getSingleMetric('tenant_cache_entries') as Gauge) ||
      new Gauge({
        name: 'tenant_cache_entries',
        help: 'Current number of tenant cache entries (id + code aliases counted)',
        registers: [globalRegistry],
      });
    this.hitsCounter =
      (globalRegistry.getSingleMetric('tenant_cache_hits_total') as Counter) ||
      new Counter({
        name: 'tenant_cache_hits_total',
        help: 'Cumulative tenant cache resolve hits',
        registers: [globalRegistry],
      });
    this.missesCounter =
      (globalRegistry.getSingleMetric('tenant_cache_misses_total') as Counter) ||
      new Counter({
        name: 'tenant_cache_misses_total',
        help: 'Cumulative tenant cache resolve misses',
        registers: [globalRegistry],
      });
  }

  private collectSafe() {
    try {
      this.collect();
    } catch {
      // swallow — metrics collection must not crash the process
    }
  }

  private collect() {
    const stats = this.cache.snapshotStats();
    // entries: map stores both id + code; we report raw size.
    this.entriesGauge?.set(stats.size);
    // Convert absolute hits/misses snapshot to incremental counters
    const incHits = Math.max(0, stats.hits - this.lastHits);
    const incMisses = Math.max(0, stats.misses - this.lastMisses);
    if (incHits) this.hitsCounter?.inc(incHits);
    if (incMisses) this.missesCounter?.inc(incMisses);
    this.lastHits = stats.hits;
    this.lastMisses = stats.misses;
  }
}
