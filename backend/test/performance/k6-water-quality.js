import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

// Test data
const waterQualityData = {
  temperature: 25.5,
  ph: 7.2,
  dissolvedOxygen: 8.5,
  ammonia: 0.1,
  nitrite: 0.05,
  nitrate: 5.0,
  salinity: 35.0,
  turbidity: 2.1,
  alkalinity: 120.0,
  hardness: 150.0,
  readingMethod: 'sensor',
  notes: 'Automated sensor reading',
  pondId: 'test-pond-id',
  recordedById: 'test-user-id'
};

export default function() {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-Id': TENANT_ID,
  };

  // Test water quality creation
  const createResponse = http.post(`${BASE_URL}/api/water-quality`, JSON.stringify(waterQualityData), {
    headers: headers,
  });

  const createSuccess = check(createResponse, {
    'water quality creation status is 201': (r) => r.status === 201,
    'water quality creation response time < 500ms': (r) => r.timings.duration < 500,
    'water quality creation has valid response': (r) => r.json('id') !== undefined,
  });

  errorRate.add(!createSuccess);

  // Test water quality listing
  const listResponse = http.get(`${BASE_URL}/api/water-quality?page=1&limit=10`, {
    headers: headers,
  });

  const listSuccess = check(listResponse, {
    'water quality list status is 200': (r) => r.status === 200,
    'water quality list response time < 300ms': (r) => r.timings.duration < 300,
    'water quality list has data array': (r) => Array.isArray(r.json('data')),
  });

  errorRate.add(!listSuccess);

  // Test water quality trends
  const trendsResponse = http.get(`${BASE_URL}/api/water-quality/trends?days=7`, {
    headers: headers,
  });

  const trendsSuccess = check(trendsResponse, {
    'water quality trends status is 200': (r) => r.status === 200,
    'water quality trends response time < 400ms': (r) => r.timings.duration < 400,
    'water quality trends has trends data': (r) => r.json('trends') !== undefined,
  });

  errorRate.add(!trendsSuccess);

  sleep(1); // Wait 1 second between requests
}

export function handleSummary(data) {
  return {
    'performance-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test: 'water-quality-performance',
      summary: {
        total_requests: data.metrics.http_reqs.values.count,
        avg_response_time: data.metrics.http_req_duration.values.avg,
        p95_response_time: data.metrics.http_req_duration.values['p(95)'],
        error_rate: data.metrics.http_req_failed.values.rate,
        custom_error_rate: data.metrics.errors.values.rate,
      },
      thresholds: {
        p95_under_500ms: data.metrics.http_req_duration.values['p(95)'] < 500,
        error_rate_under_10_percent: data.metrics.http_req_failed.values.rate < 0.1,
      }
    }, null, 2),
  };
}
