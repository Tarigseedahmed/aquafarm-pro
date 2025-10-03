# Performance Testing with k6

This directory contains k6 performance tests for the AquaFarm backend API.

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/
2. Ensure the backend is running and accessible
3. Set up test environment variables

## Test Files

### 1. `k6-water-quality.js`
Tests water quality endpoints performance:
- Water quality creation
- Water quality listing
- Water quality trends
- Thresholds: 95% of requests < 500ms, error rate < 10%

### 2. `k6-iot-ingestion.js`
Tests IoT ingestion endpoint performance:
- HMAC signature validation
- IoT data ingestion
- Thresholds: 95% of requests < 200ms, error rate < 5%

### 3. `k6-load-test.js`
Comprehensive load testing across multiple endpoints:
- Multiple API endpoints with weighted distribution
- Authentication testing
- Thresholds: 95% of requests < 1s, error rate < 15%

## Running Tests

### Basic Performance Test
```bash
# Water quality endpoints
k6 run test/performance/k6-water-quality.js

# IoT ingestion
k6 run test/performance/k6-iot-ingestion.js

# Comprehensive load test
k6 run test/performance/k6-load-test.js
```

### With Environment Variables
```bash
# Set test environment
export BASE_URL="http://localhost:3000"
export JWT_TOKEN="your-jwt-token"
export TENANT_ID="your-tenant-id"
export IOT_SHARED_SECRET="your-iot-secret"

# Run tests
k6 run test/performance/k6-water-quality.js
k6 run test/performance/k6-iot-ingestion.js
k6 run test/performance/k6-load-test.js
```

### Custom Configuration
```bash
# Run with custom duration and users
k6 run --duration 10m --vus 50 test/performance/k6-load-test.js

# Run with custom thresholds
k6 run --threshold http_req_duration=p(95)<800 test/performance/k6-water-quality.js
```

## Test Results

Each test generates a JSON summary with:
- Total requests
- Average response time
- 95th percentile response time
- Error rates
- Threshold compliance

## Performance Targets

| Test Type | Target Response Time | Max Error Rate | Max Users |
|-----------|---------------------|----------------|-----------|
| Water Quality | 500ms (95%) | 10% | 20 |
| IoT Ingestion | 200ms (95%) | 5% | 10 |
| Load Test | 1000ms (95%) | 15% | 100 |

## Monitoring During Tests

1. **Backend Metrics**: Monitor `/metrics` endpoint for Prometheus metrics
2. **Database Performance**: Check database connection pool and query performance
3. **Memory Usage**: Monitor Node.js memory usage and garbage collection
4. **Network**: Check network latency and bandwidth usage

## Troubleshooting

### High Response Times
- Check database query performance
- Verify caching is working
- Monitor memory usage
- Check network latency

### High Error Rates
- Verify authentication tokens are valid
- Check database connections
- Monitor server resources
- Verify tenant isolation

### IoT Ingestion Issues
- Verify HMAC signature generation
- Check IOT_SHARED_SECRET configuration
- Monitor tenant context extraction
- Verify water quality service integration

## Continuous Integration

Add to CI pipeline:
```yaml
- name: Run Performance Tests
  run: |
    k6 run test/performance/k6-water-quality.js
    k6 run test/performance/k6-iot-ingestion.js
    k6 run test/performance/k6-load-test.js
```

## Production Testing

For production load testing:
1. Use staging environment
2. Set appropriate user limits
3. Monitor infrastructure metrics
4. Coordinate with operations team
5. Have rollback plan ready
