import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authErrorRate = new Rate('auth_errors');

// Test configuration for comprehensive load testing
export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.15'],    // Error rate must be below 15%
    errors: ['rate<0.15'],
    auth_errors: ['rate<0.05'], // Auth errors should be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

// Test different endpoints with different weights
const endpoints = [
  { weight: 30, path: '/api/water-quality', method: 'GET' },
  { weight: 20, path: '/api/ponds', method: 'GET' },
  { weight: 15, path: '/api/farms', method: 'GET' },
  { weight: 10, path: '/api/water-quality/trends?days=7', method: 'GET' },
  { weight: 10, path: '/api/notifications', method: 'GET' },
  { weight: 10, path: '/api/users/me', method: 'GET' },
  { weight: 5, path: '/api/water-quality', method: 'POST' },
];

// Select endpoint based on weight
function selectEndpoint() {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const endpoint of endpoints) {
    cumulative += endpoint.weight;
    if (random <= cumulative) {
      return endpoint;
    }
  }
  
  return endpoints[0]; // Fallback
}

// Test data for POST requests
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
  readingMethod: 'manual',
  notes: 'Load test reading',
  pondId: 'test-pond-id',
  recordedById: 'test-user-id'
};

export default function() {
  const endpoint = selectEndpoint();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'X-Tenant-Id': TENANT_ID,
  };

  let response;
  let success;

  if (endpoint.method === 'GET') {
    response = http.get(`${BASE_URL}${endpoint.path}`, { headers });
    
    success = check(response, {
      [`${endpoint.path} status is 200`]: (r) => r.status === 200,
      [`${endpoint.path} response time < 1s`]: (r) => r.timings.duration < 1000,
      [`${endpoint.path} has valid response`]: (r) => r.body.length > 0,
    });
  } else if (endpoint.method === 'POST') {
    response = http.post(`${BASE_URL}${endpoint.path}`, JSON.stringify(waterQualityData), {
      headers: headers,
    });
    
    success = check(response, {
      [`${endpoint.path} POST status is 201`]: (r) => r.status === 201,
      [`${endpoint.path} POST response time < 1s`]: (r) => r.timings.duration < 1000,
      [`${endpoint.path} POST has valid response`]: (r) => r.json('id') !== undefined,
    });
  }

  errorRate.add(!success);

  // Test authentication errors (5% of requests)
  if (Math.random() < 0.05) {
    const authResponse = http.get(`${BASE_URL}${endpoint.path}`, {
      headers: { 'Content-Type': 'application/json' }, // No auth header
    });

    const authSuccess = check(authResponse, {
      'Unauthenticated request returns 401': (r) => r.status === 401,
    });

    authErrorRate.add(!authSuccess);
  }

  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}

export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test: 'comprehensive-load-test',
      summary: {
        total_requests: data.metrics.http_reqs.values.count,
        avg_response_time: data.metrics.http_req_duration.values.avg,
        p95_response_time: data.metrics.http_req_duration.values['p(95)'],
        p99_response_time: data.metrics.http_req_duration.values['p(99)'],
        error_rate: data.metrics.http_req_failed.values.rate,
        custom_error_rate: data.metrics.errors.values.rate,
        auth_error_rate: data.metrics.auth_errors.values.rate,
        max_users: 100,
        test_duration: '21 minutes',
      },
      thresholds: {
        p95_under_1s: data.metrics.http_req_duration.values['p(95)'] < 1000,
        error_rate_under_15_percent: data.metrics.http_req_failed.values.rate < 0.15,
        auth_error_rate_under_5_percent: data.metrics.auth_errors.values.rate < 0.05,
      },
      recommendations: {
        performance: data.metrics.http_req_duration.values['p(95)'] > 1000 ? 
          'Consider optimizing database queries and adding caching' : 'Performance is acceptable',
        reliability: data.metrics.http_req_failed.values.rate > 0.15 ? 
          'High error rate detected - investigate server stability' : 'Error rate is acceptable',
        authentication: data.metrics.auth_errors.values.rate > 0.05 ? 
          'Authentication issues detected - check JWT validation' : 'Authentication is working correctly',
      }
    }, null, 2),
  };
}
