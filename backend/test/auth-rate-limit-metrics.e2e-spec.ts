/* eslint-disable linebreak-style */
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

/**
 * E2E test verifying that a throttled /auth/login request increments the
 * Prometheus counter: rate_limit_exceeded_total{route="..."}.
 *
 * Strategy:
 * 1. Bootstrap fresh app instance (isolated registry -> counters start at 0).
 * 2. Register a user (not subject to login throttle counter).
 * 3. Capture baseline /metrics output and parse value for the auth login route if present.
 * 4. Execute 6 rapid failed login attempts (limit is 5/min) to trigger a 429.
 * 5. Fetch /metrics again and assert the counter increased by >= 1 for that route label.
 */

describe('Auth Login Rate Limiting Metrics (e2e)', () => {
  let app: INestApplication;
  let server: any;
  const email = 'ratelimit-metrics@example.com';
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const { bootstrapTestApp } = await import('./bootstrap-test-app');
    app = await bootstrapTestApp(moduleRef);
    server = app.getHttpServer();

    const reg = await request(server)
      .post('/api/auth/register')
      .send({ email, password, name: 'Metrics RL' });
    expect(reg.status).toBe(201);
  });

  afterAll(async () => {
    await app.close();
  });

  function parseRateLimitCounter(metricsText: string): number {
    return metricsText
      .split(/\n+/)
      .filter((l) => l.startsWith('rate_limit_exceeded_total{'))
      .map((l) => Number(l.trim().split(/\s+/).pop() || 0))
      .filter((n) => !Number.isNaN(n))
      .reduce((a, b) => a + b, 0);
  }

  it('increments rate_limit_exceeded_total counter when throttling occurs', async () => {
    const beforeMetrics = await request(server).get('/api/metrics');
    expect(beforeMetrics.status).toBe(200);
    const beforeVal = parseRateLimitCounter(beforeMetrics.text);

    for (let i = 0; i < 5; i++) {
      const res = await request(server).post('/api/auth/login').send({ email, password: 'Wrong' });
      expect([400, 401]).toContain(res.status);
    }
    const throttled = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'Wrong' });
    expect(throttled.status).toBe(429);

    const afterMetrics = await request(server).get('/api/metrics');
    expect(afterMetrics.status).toBe(200);
    const snippet = afterMetrics.text
      .split('\n')
      .filter((l) => l.trim().startsWith('rate_limit_exceeded_total'))
      .join('\n');
    // eslint-disable-next-line no-console
    console.log('rate_limit_exceeded_total snippet ->\n' + snippet);
    const afterVal = parseRateLimitCounter(afterMetrics.text);
    if (afterVal <= beforeVal) {
      // Provide more context if failing
      // eslint-disable-next-line no-console
      console.warn(
        'Full metrics (first 40 lines) for debug:\n' +
          afterMetrics.text.split('\n').slice(0, 40).join('\n'),
      );
    }
    expect(afterVal).toBeGreaterThan(beforeVal);
  });
});
