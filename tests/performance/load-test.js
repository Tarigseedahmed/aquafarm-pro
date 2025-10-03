import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    errors: ['rate<0.01'],            // Custom error rate must be below 1%
  },
};

// Base URL for the API
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'user3@test.com', password: 'password123' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to authenticate user
function authenticateUser(user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const loginData = JSON.parse(loginResponse.body);
    return loginData.access_token;
  }
  
  return null;
}

// Main test function
export default function () {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: Get user profile
  const profileResponse = http.get(`${BASE_URL}/api/users/me`, { headers });
  check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(profileResponse.status !== 200);

  // Test 2: Get farms list
  const farmsResponse = http.get(`${BASE_URL}/api/farms`, { headers });
  check(farmsResponse, {
    'farms status is 200': (r) => r.status === 200,
    'farms response time < 300ms': (r) => r.timings.duration < 300,
    'farms has data': (r) => {
      const data = JSON.parse(r.body);
      return data.data && Array.isArray(data.data);
    },
  });
  errorRate.add(farmsResponse.status !== 200);

  // Test 3: Get ponds list
  const pondsResponse = http.get(`${BASE_URL}/api/ponds`, { headers });
  check(pondsResponse, {
    'ponds status is 200': (r) => r.status === 200,
    'ponds response time < 300ms': (r) => r.timings.duration < 300,
    'ponds has data': (r) => {
      const data = JSON.parse(r.body);
      return data.data && Array.isArray(data.data);
    },
  });
  errorRate.add(pondsResponse.status !== 200);

  // Test 4: Get water quality readings
  const waterQualityResponse = http.get(`${BASE_URL}/api/water-quality`, { headers });
  check(waterQualityResponse, {
    'water quality status is 200': (r) => r.status === 200,
    'water quality response time < 300ms': (r) => r.timings.duration < 300,
    'water quality has data': (r) => {
      const data = JSON.parse(r.body);
      return data.data && Array.isArray(data.data);
    },
  });
  errorRate.add(waterQualityResponse.status !== 200);

  // Test 5: Get fish batches
  const fishBatchesResponse = http.get(`${BASE_URL}/api/fish-batches`, { headers });
  check(fishBatchesResponse, {
    'fish batches status is 200': (r) => r.status === 200,
    'fish batches response time < 300ms': (r) => r.timings.duration < 300,
    'fish batches has data': (r) => {
      const data = JSON.parse(r.body);
      return data.data && Array.isArray(data.data);
    },
  });
  errorRate.add(fishBatchesResponse.status !== 200);

  // Test 6: Get dashboard stats
  const dashboardResponse = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
  check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 300ms': (r) => r.timings.duration < 300,
    'dashboard has stats': (r) => {
      const data = JSON.parse(r.body);
      return data.totalFarms !== undefined;
    },
  });
  errorRate.add(dashboardResponse.status !== 200);

  // Test 7: Create a new water quality reading (POST request)
  const waterQualityPayload = JSON.stringify({
    pondId: 'test-pond-id',
    temperature: 25.5,
    ph: 7.2,
    dissolvedOxygen: 8.5,
    ammonia: 0.1,
    nitrite: 0.05,
    nitrate: 10.0,
    salinity: 35.0,
    turbidity: 2.0,
    alkalinity: 120.0,
    hardness: 150.0,
    recordedBy: 'test-user-id',
  });

  const createWaterQualityResponse = http.post(
    `${BASE_URL}/api/water-quality`,
    waterQualityPayload,
    { headers }
  );
  
  check(createWaterQualityResponse, {
    'create water quality status is 201': (r) => r.status === 201,
    'create water quality response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(createWaterQualityResponse.status !== 201);

  // Test 8: Get notifications
  const notificationsResponse = http.get(`${BASE_URL}/api/notifications`, { headers });
  check(notificationsResponse, {
    'notifications status is 200': (r) => r.status === 200,
    'notifications response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(notificationsResponse.status !== 200);

  // Test 9: Get alerts
  const alertsResponse = http.get(`${BASE_URL}/api/alerts`, { headers });
  check(alertsResponse, {
    'alerts status is 200': (r) => r.status === 200,
    'alerts response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(alertsResponse.status !== 200);

  // Test 10: Get BI analytics
  const biResponse = http.get(`${BASE_URL}/api/bi/kpis`, { headers });
  check(biResponse, {
    'BI status is 200': (r) => r.status === 200,
    'BI response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(biResponse.status !== 200);

  // Wait between requests
  sleep(1);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Setting up performance test...');
  
  // Check if the API is accessible
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`API is not accessible: ${healthResponse.status}`);
  }
  
  console.log('Performance test setup completed');
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Performance test teardown...');
  console.log(`Test completed for ${data.baseUrl}`);
}
