# Observability Setup Guide

## Overview

This guide covers the complete observability stack for AquaFarm Pro including metrics, logging, and distributed tracing.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Promtail      │    │   Loki          │
│   (Backend)     │───▶│   (Log Agent)   │───▶│   (Log Store)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │   Grafana       │    │   Jaeger        │
│   (Metrics)     │◀───│   (Dashboard)   │    │   (Tracing)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │ OpenTelemetry   │
                    │   Collector     │
                    └─────────────────┘
```

## Components

### 1. Metrics (Prometheus + Grafana)

**Prometheus** collects metrics from:
- Application metrics (`/_metrics` endpoint)
- Kubernetes cluster metrics
- Node exporter metrics
- Custom business metrics

**Grafana** provides dashboards for:
- Application performance
- Infrastructure monitoring
- Business KPIs
- Alerting rules

### 2. Logging (Loki + Promtail)

**Loki** stores logs from:
- Application logs
- Kubernetes pod logs
- System logs
- Audit logs

**Promtail** collects logs from:
- Kubernetes pods
- Node filesystem
- Docker containers
- Systemd journals

### 3. Tracing (OpenTelemetry + Jaeger)

**OpenTelemetry Collector** receives traces from:
- Backend application
- Frontend application
- Database queries
- External API calls

**Jaeger** provides:
- Distributed tracing
- Service dependency mapping
- Performance analysis
- Error tracking

## Configuration

### Helm Values

```yaml
monitoring:
  enabled: true
  
  # Metrics
  prometheus:
    enabled: true
    server:
      persistentVolume:
        enabled: true
        size: 50Gi
  
  grafana:
    enabled: true
    adminPassword: "secure-password"
    persistence:
      enabled: true
      size: 10Gi
  
  # Logging
  loki:
    enabled: true
    persistence:
      enabled: true
      size: 20Gi
  
  promtail:
    enabled: true
  
  # Tracing
  tracing:
    enabled: true
    jaegerEndpoint: "jaeger:14250"
```

### Environment Variables

```yaml
backend:
  env:
    # Metrics
    ENABLE_METRICS: "true"
    METRICS_PORT: "3001"
    
    # Logging
    LOG_LEVEL: "info"
    ENABLE_LOGGING: "true"
    
    # Tracing
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector:4318"
    OTEL_SERVICE_NAME: "aquafarm-backend"
```

## Deployment

### 1. Deploy with Monitoring

```bash
# Deploy with full observability stack
helm upgrade --install aquafarm ./infra/helm/aquafarm \
  --namespace production \
  --create-namespace \
  --set monitoring.enabled=true \
  --set monitoring.prometheus.enabled=true \
  --set monitoring.grafana.enabled=true \
  --set monitoring.loki.enabled=true \
  --set monitoring.promtail.enabled=true \
  --set monitoring.tracing.enabled=true \
  --values ./infra/helm/aquafarm/values-production.yaml
```

### 2. Access Services

```bash
# Port forward to access services
kubectl port-forward svc/aquafarm-grafana 3000:80 -n production
kubectl port-forward svc/aquafarm-loki 3100:3100 -n production
kubectl port-forward svc/aquafarm-otel-collector 4318:4318 -n production

# Access URLs
# Grafana: http://localhost:3000 (admin/secure-password)
# Loki: http://localhost:3100
# Jaeger: http://localhost:16686
```

## Dashboards

### 1. Application Metrics

**Grafana Dashboard: AquaFarm Observability**

Panels include:
- Request rate and latency
- Error rate and 4xx/5xx responses
- Database connection pool
- Cache hit/miss ratios
- Business metrics (farms, ponds, users)

### 2. Infrastructure Metrics

**Grafana Dashboard: Kubernetes Cluster**

Panels include:
- Node CPU/Memory usage
- Pod resource consumption
- Network I/O
- Storage usage
- Pod restart counts

### 3. Log Analysis

**Grafana Dashboard: Application Logs**

Panels include:
- Log volume by service
- Error log patterns
- User activity logs
- Security events
- Performance logs

## Alerting

### 1. Critical Alerts

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"

# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
```

### 2. Business Alerts

```yaml
# Low user activity
- alert: LowUserActivity
  expr: rate(user_logins_total[1h]) < 0.1
  for: 30m
  labels:
    severity: warning
  annotations:
    summary: "Low user activity detected"
```

## Logging Best Practices

### 1. Structured Logging

```typescript
// Good: Structured logging
logger.info('User login', {
  userId: user.id,
  email: user.email,
  ip: request.ip,
  userAgent: request.headers['user-agent']
});

// Bad: Unstructured logging
logger.info(`User ${user.id} logged in from ${request.ip}`);
```

### 2. Log Levels

```typescript
// ERROR: System errors, exceptions
logger.error('Database connection failed', { error: err.message });

// WARN: Recoverable issues
logger.warn('Rate limit exceeded', { userId, ip });

// INFO: Business events
logger.info('Farm created', { farmId, userId });

// DEBUG: Development debugging
logger.debug('Cache miss', { key, ttl });
```

### 3. Correlation IDs

```typescript
// Add correlation ID to all logs
const correlationId = req.headers['x-correlation-id'] || uuid();
logger.info('Request started', { correlationId, method, url });
```

## Tracing Best Practices

### 1. Span Naming

```typescript
// Good: Descriptive span names
tracer.startSpan('user.login');
tracer.startSpan('database.query.users.findByEmail');
tracer.startSpan('cache.get.user:123');

// Bad: Generic span names
tracer.startSpan('operation');
tracer.startSpan('query');
```

### 2. Span Attributes

```typescript
// Add relevant attributes
span.setAttributes({
  'user.id': user.id,
  'user.email': user.email,
  'database.table': 'users',
  'cache.key': 'user:123',
  'http.method': 'POST',
  'http.status_code': 200
});
```

### 3. Error Handling

```typescript
// Record errors in spans
try {
  await database.query(sql);
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  span.end();
}
```

## Performance Optimization

### 1. Metrics Collection

```typescript
// Use counters for rates
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Use histograms for latencies
const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route']
});
```

### 2. Log Sampling

```yaml
# Sample high-volume logs
logging:
  sampling:
    enabled: true
    rate: 0.1  # 10% sampling
    rules:
      - level: debug
        rate: 0.01  # 1% for debug logs
      - level: info
        rate: 0.1   # 10% for info logs
```

### 3. Trace Sampling

```typescript
// Sample traces based on conditions
const sampler = new TraceIdRatioBasedSampler(0.1); // 10% sampling
const tracer = new NodeTracerProvider({
  sampler,
  resource: new Resource({
    'service.name': 'aquafarm-backend',
    'service.version': '0.2.0'
  })
});
```

## Troubleshooting

### 1. Check Service Status

```bash
# Check all monitoring services
kubectl get pods -l app.kubernetes.io/component=monitoring -n production

# Check logs
kubectl logs -f deployment/aquafarm-prometheus -n production
kubectl logs -f deployment/aquafarm-grafana -n production
kubectl logs -f deployment/aquafarm-loki -n production
```

### 2. Verify Metrics

```bash
# Check Prometheus targets
kubectl port-forward svc/aquafarm-prometheus 9090:9090 -n production
curl http://localhost:9090/api/v1/targets

# Check application metrics
curl http://localhost:3000/_metrics
```

### 3. Check Logs

```bash
# Check Loki targets
kubectl port-forward svc/aquafarm-loki 3100:3100 -n production
curl http://localhost:3100/ready

# Query logs
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="kubernetes-pods"}' \
  --data-urlencode 'start=2023-01-01T00:00:00Z' \
  --data-urlencode 'end=2023-01-01T01:00:00Z'
```

## Security Considerations

### 1. Access Control

```yaml
# Restrict access to monitoring endpoints
ingress:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
```

### 2. Data Retention

```yaml
# Configure retention policies
prometheus:
  server:
    retention: "30d"
    retentionSize: "10GB"

loki:
  config:
    limits_config:
      retention_period: "30d"
```

### 3. Encryption

```yaml
# Enable TLS for all components
tls:
  enabled: true
  certManager:
    enabled: true
    issuer: "letsencrypt-prod"
```

## Cost Optimization

### 1. Resource Limits

```yaml
# Set appropriate resource limits
monitoring:
  prometheus:
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
```

### 2. Storage Optimization

```yaml
# Use appropriate storage classes
prometheus:
  server:
    persistentVolume:
      storageClass: "gp3"  # AWS EBS GP3
      size: 50Gi

loki:
  persistence:
    storageClass: "gp3"
    size: 20Gi
```

### 3. Sampling

```yaml
# Reduce data volume with sampling
tracing:
  sampling:
    rate: 0.1  # 10% sampling
  retention: "7d"
```

## Maintenance

### 1. Regular Backups

```bash
# Backup Prometheus data
kubectl exec -it aquafarm-prometheus-0 -n production -- tar -czf /tmp/prometheus-backup.tar.gz /prometheus

# Backup Grafana dashboards
kubectl exec -it aquafarm-grafana-0 -n production -- grafana-cli admin export-dashboard > dashboard.json
```

### 2. Health Checks

```bash
# Check Prometheus health
curl http://localhost:9090/-/healthy

# Check Grafana health
curl http://localhost:3000/api/health

# Check Loki health
curl http://localhost:3100/ready
```

### 3. Updates

```bash
# Update monitoring stack
helm upgrade aquafarm ./infra/helm/aquafarm \
  --namespace production \
  --set monitoring.prometheus.enabled=true \
  --set monitoring.grafana.enabled=true
```

## Support

For issues and questions:
- Check logs: `kubectl logs -f deployment/<deployment-name> -n <namespace>`
- Check metrics: `curl http://localhost:3000/_metrics`
- Check traces: `kubectl port-forward svc/jaeger 16686:16686 -n production`
- Check logs: `kubectl port-forward svc/loki 3100:3100 -n production`
