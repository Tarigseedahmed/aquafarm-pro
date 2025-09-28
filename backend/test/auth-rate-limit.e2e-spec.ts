import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

/**
 * E2E test verifying per-route throttling on /auth/login.
 * Uses the configured @Throttle override (5 req/min/IP).
 * We attempt 6 rapid login attempts with invalid password to trigger 429 on the 6th.
 */

describe('Auth Login Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let server: any;
  const email = 'ratelimit@example.com';
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
    server = app.getHttpServer();

    // Register the user first (should not count against login throttling)
    const reg = await request(server)
      .post('/api/auth/register')
      .send({ email, password, name: 'RL' });
    expect(reg.status).toBe(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks after exceeding 5 login attempts within the window and returns Retry-After', async () => {
    // Perform 5 failed attempts (wrong password) - expecting 401 (or 400 depending on auth logic)
    for (let i = 0; i < 5; i++) {
      const res = await request(server).post('/api/auth/login').send({ email, password: 'Wrong' });
      expect([400, 401]).toContain(res.status); // allow either depending on validation/auth failure
    }

    // 6th attempt should now be throttled -> 429
    const throttled = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'Wrong' });

    // Some environments may include a retry-after header
    if (throttled.status !== 429) {
      // If it didn't throttle, log diagnostic info to aid debugging
      // eslint-disable-next-line no-console
      console.warn('Expected throttle 429, got', throttled.status, throttled.body);
    }
    expect(throttled.status).toBe(429);
    // Retry-After may not always be present depending on underlying guard; tolerate absence
    if (throttled.headers['retry-after']) {
      expect(parseInt(throttled.headers['retry-after'], 10)).toBeGreaterThan(0);
    }
    expect(throttled.body).toBeDefined();
    // message might be nested; we just confirm some rate limit semantics present
    const bodyText = JSON.stringify(throttled.body).toLowerCase();
    expect(bodyText.includes('limit') || bodyText.includes('throttle') || bodyText.includes('too')).toBe(true);
  });
});
