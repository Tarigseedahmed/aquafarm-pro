import { Injectable } from '@nestjs/common';
import { normalizeRoute } from './route-normalizer';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  register as globalRegistry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  // Use global registry to avoid multiple isolated registries across different injection sites
  private readonly registry = globalRegistry;
  private httpRequestsTotal: Counter;
  private sseClients: Counter;
  private notificationsEmitted: Counter;
  private activeSseConnections: Gauge;
  private rateLimitExceeded: Counter;
  private http5xxErrors: Counter;
  private httpRequestDuration: Histogram;
  private forbiddenRequests: Counter;

  private initialized = false;
  // Process-wide guard so we only collect default metrics once even if multiple app instances
  private static defaultCollected = false;

  init() {
    if (this.initialized) return;

    // Collect default metrics only once per process
    if (!MetricsService.defaultCollected) {
      try {
        collectDefaultMetrics({ register: this.registry });
      } catch {
        /* ignore duplicate collection errors */
      }
      MetricsService.defaultCollected = true;
    }

    // Helper to fetch existing metric or create a new one
    const ensureCounter = (name: string, help: string, labelNames?: readonly string[]) => {
      const existing = this.registry.getSingleMetric(name) as Counter | undefined;
      if (existing) return existing as Counter;
      const cfg: any = { name, help, registers: [this.registry] };
      if (labelNames) cfg.labelNames = labelNames;
      return new Counter(cfg);
    };
    const ensureGauge = (name: string, help: string) => {
      const existing = this.registry.getSingleMetric(name) as Gauge | undefined;
      if (existing) return existing as Gauge;
      return new Gauge({ name, help, registers: [this.registry] });
    };
    const ensureHistogram = (
      name: string,
      help: string,
      labelNames: readonly string[] | undefined,
      buckets?: number[],
    ) => {
      const existing = this.registry.getSingleMetric(name) as Histogram | undefined;
      if (existing) return existing as Histogram;
      const cfg: any = { name, help, registers: [this.registry] };
      if (labelNames) cfg.labelNames = labelNames;
      if (buckets) cfg.buckets = buckets;
      return new Histogram(cfg);
    };

    this.httpRequestsTotal = ensureCounter('http_requests_total', 'Total number of HTTP requests', [
      'method',
      'status',
    ] as const);
    this.sseClients = ensureCounter(
      'sse_clients_total',
      'Total SSE client connections (accumulative)',
    );
    this.notificationsEmitted = ensureCounter(
      'notifications_emitted_total',
      'Number of notification events emitted',
    );
    this.activeSseConnections = ensureGauge(
      'active_sse_connections',
      'Current number of open SSE notification connections',
    );
    this.rateLimitExceeded = ensureCounter(
      'rate_limit_exceeded_total',
      'Number of requests rejected due to rate limiting',
      ['route'] as const,
    );
    this.http5xxErrors = ensureCounter(
      'http_5xx_errors_total',
      'Total number of HTTP 5xx responses',
      ['route', 'status'] as const,
    );
    this.httpRequestDuration = ensureHistogram(
      'http_request_duration_seconds',
      'Duration of HTTP requests in seconds',
      ['method', 'route', 'status'] as const,
      // Buckets tuned for typical API latencies: 5ms .. 5s
      [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    );
    this.forbiddenRequests = ensureCounter(
      'forbidden_requests_total',
      'Number of forbidden (403) responses with reason label',
      ['route', 'reason'] as const,
    );

    this.initialized = true;
  }

  private ensureInitialized() {
    // If one of the counters is missing, initialization likely hasn't run yet.
    if (!this.initialized) this.init();
  }

  incRequest(method: string, status: number) {
    this.ensureInitialized();
    this.httpRequestsTotal.inc({ method, status: String(status) });
  }
  incSseClient() {
    this.ensureInitialized();
    this.sseClients.inc();
    this.activeSseConnections.inc();
  }
  decSseClient() {
    // Guard against negative
    try {
      this.activeSseConnections.dec();
    } catch {
      /* ignore */
    }
  }
  incNotification() {
    this.ensureInitialized();
    this.notificationsEmitted.inc();
  }

  incRateLimit(route: string) {
    this.ensureInitialized();
    const normalized = normalizeRoute(route);
    this.rateLimitExceeded.inc({ route: normalized });
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line no-console
      console.log('[metrics] rate_limit_exceeded_total inc for route', normalized);
    }
  }

  observeRequestDuration(method: string, route: string, status: number, seconds: number) {
    this.ensureInitialized();
    const normRoute = normalizeRoute(route);
    this.httpRequestDuration.observe({ method, route: normRoute, status: String(status) }, seconds);
    if (status >= 500 && status < 600) {
      this.http5xxErrors.inc({ route: normRoute, status: String(status) });
    }
  }

  async expose(): Promise<string> {
    this.ensureInitialized();
    return this.registry.metrics();
  }

  incForbidden(route: string, reason: string) {
    this.ensureInitialized();
    const normRoute = normalizeRoute(route);
    this.forbiddenRequests.inc({ route: normRoute, reason });
  }
}
