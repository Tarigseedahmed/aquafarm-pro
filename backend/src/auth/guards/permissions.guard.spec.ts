import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MetricsService } from '../../observability/metrics.service';

function mockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
    // minimal stubs
    getArgByIndex: () => undefined,
    getArgs: () => [],
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const reflector = new Reflector();
  let guard: PermissionsGuard;
  const metricsMock: Partial<MetricsService> = {
    incForbidden: jest.fn(),
  } as any;

  beforeEach(() => {
    guard = new PermissionsGuard(reflector, metricsMock as MetricsService);
  });

  it('passes when no permissions required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined as any);
    const ctx = mockContext({ role: 'user' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows admin with required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.create']);
    const ctx = mockContext({ role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies user missing permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant.update']);
    const ctx = mockContext({ role: 'user' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(metricsMock.incForbidden).toHaveBeenCalled();
  });
});

