import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import crypto from 'k6/crypto';

// Custom metrics
const errorRate = new Rate('errors');
const hmacErrorRate = new Rate('hmac_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },  // Ramp up
    { duration: '3m', target: 5 },  // Stay at 5 devices
    { duration: '1m', target: 10 }, // Ramp up to 10 devices
    { duration: '3m', target: 10 }, // Stay at 10 devices
    { duration: '1m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // IoT endpoints should be very fast
    http_req_failed: ['rate<0.05'],   // Error rate must be below 5%
    errors: ['rate<0.05'],
    hmac_errors: ['rate<0.01'], // HMAC errors should be very rare
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const IOT_SECRET = __ENV.IOT_SHARED_SECRET || 'test-secret-key';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant';

// Generate HMAC signature for request body
function generateHmacSignature(secret, body) {
  return crypto.hmac('sha256', secret, body, 'hex');
}

// Test data for IoT ingestion
const iotData = {
  temperature: 25.5 + Math.random() * 2, // Randomize slightly
  ph: 7.0 + Math.random() * 0.5,
  dissolvedOxygen: 8.0 + Math.random() * 1,
  ammonia: 0.05 + Math.random() * 0.1,
  nitrite: 0.02 + Math.random() * 0.05,
  nitrate: 3.0 + Math.random() * 2,
  salinity: 34.0 + Math.random() * 2,
  turbidity: 1.5 + Math.random() * 1,
  alkalinity: 110.0 + Math.random() * 20,
  hardness: 140.0 + Math.random() * 20,
  readingMethod: 'sensor',
  notes: `IoT sensor reading ${Date.now()}`,
  pondId: 'test-pond-id',
  recordedById: 'iot-device-001'
};

export default function() {
  const body = JSON.stringify(iotData);
  const signature = generateHmacSignature(IOT_SECRET, body);

  const headers = {
    'Content-Type': 'application/json',
    'X-Signature': signature,
    'X-Tenant-Id': TENANT_ID,
  };

  // Test IoT ingestion endpoint
  const ingestResponse = http.post(`${BASE_URL}/api/iot/ingest`, body, {
    headers: headers,
  });

  const ingestSuccess = check(ingestResponse, {
    'IoT ingestion status is 201': (r) => r.status === 201,
    'IoT ingestion response time < 200ms': (r) => r.timings.duration < 200,
    'IoT ingestion has valid response': (r) => r.json('id') !== undefined,
    'IoT ingestion preserves sensor method': (r) => r.json('readingMethod') === 'sensor',
  });

  errorRate.add(!ingestSuccess);

  // Test HMAC signature validation (intentionally wrong signature)
  if (Math.random() < 0.1) { // 10% chance to test invalid signature
    const wrongSignature = generateHmacSignature('wrong-secret', body);
    const wrongHeaders = {
      'Content-Type': 'application/json',
      'X-Signature': wrongSignature,
      'X-Tenant-Id': TENANT_ID,
    };

    const wrongResponse = http.post(`${BASE_URL}/api/iot/ingest`, body, {
      headers: wrongHeaders,
    });

    const wrongSignatureSuccess = check(wrongResponse, {
      'Wrong signature returns 401': (r) => r.status === 401,
    });

    hmacErrorRate.add(!wrongSignatureSuccess);
  }

  sleep(0.5); // IoT devices typically send data every 30 seconds to 5 minutes
}

export function handleSummary(data) {
  return {
    'iot-performance-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test: 'iot-ingestion-performance',
      summary: {
        total_requests: data.metrics.http_reqs.values.count,
        avg_response_time: data.metrics.http_req_duration.values.avg,
        p95_response_time: data.metrics.http_req_duration.values['p(95)'],
        error_rate: data.metrics.http_req_failed.values.rate,
        custom_error_rate: data.metrics.errors.values.rate,
        hmac_error_rate: data.metrics.hmac_errors.values.rate,
      },
      thresholds: {
        p95_under_200ms: data.metrics.http_req_duration.values['p(95)'] < 200,
        error_rate_under_5_percent: data.metrics.http_req_failed.values.rate < 0.05,
        hmac_error_rate_under_1_percent: data.metrics.hmac_errors.values.rate < 0.01,
      }
    }, null, 2),
  };
}
