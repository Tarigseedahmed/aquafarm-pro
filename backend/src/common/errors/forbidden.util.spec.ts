import { ForbiddenException } from '@nestjs/common';
import { throwForbidden } from './forbidden.util';

class MockMetricsService {
  public calls: Array<{ route: string; reason: string }> = [];
  incForbidden(route: string, reason: string) {
    this.calls.push({ route, reason });
  }
}

describe('throwForbidden helper', () => {
  it('infers reason = missing_permissions when missing list present (no ownership)', () => {
    try {
      throwForbidden({
        message: 'Missing perms',
        required: ['user.write'],
        granted: ['user.read'],
        missing: ['user.write'],
      });
      fail('Expected ForbiddenException');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ForbiddenException);
      const body = e.getResponse() as any;
      expect(body.reason).toBe('missing_permissions');
      expect(body.missing).toEqual(['user.write']);
    }
  });

  it('infers reason = ownership when missing includes ownership token', () => {
    try {
      throwForbidden({
        message: 'Ownership violation',
        missing: ['ownership'],
      });
      fail('Expected ForbiddenException');
    } catch (e: any) {
      const body = e.getResponse() as any;
      expect(body.reason).toBe('ownership');
      expect(body.missing).toEqual(['ownership']);
    }
  });

  it('uses explicit reason when provided (does not infer)', () => {
    try {
      throwForbidden({
        message: 'Custom block',
        reason: 'rate_limited',
      });
      fail('Expected ForbiddenException');
    } catch (e: any) {
      const body = e.getResponse() as any;
      expect(body.reason).toBe('rate_limited');
    }
  });

  it('increments metrics with raw route and final inferred reason', () => {
    const metrics = new MockMetricsService();
    const route = '/api/users/550e8400-e29b-41d4-a716-446655440000';
    try {
      throwForbidden({
        message: 'Missing perms',
        required: ['user.write'],
        granted: ['user.read'],
        missing: ['user.write'],
        route,
        metrics: metrics as any,
      });
      fail('Expected ForbiddenException');
    } catch {
      // swallow
    }
    expect(metrics.calls.length).toBe(1);
    expect(metrics.calls[0]).toEqual({ route, reason: 'missing_permissions' });
  });

  it('does not throw if metrics object is absent', () => {
    try {
      throwForbidden({ message: 'No metrics path', missing: ['user.write'] });
      fail('Expected ForbiddenException');
    } catch (e: any) {
      const body = e.getResponse() as any;
      expect(body.reason).toBe('missing_permissions');
    }
  });
});
