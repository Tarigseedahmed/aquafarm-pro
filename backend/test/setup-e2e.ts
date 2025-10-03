// Global E2E test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';
// Avoid noisy pretty logging in tests
process.env.CI = process.env.CI || 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
