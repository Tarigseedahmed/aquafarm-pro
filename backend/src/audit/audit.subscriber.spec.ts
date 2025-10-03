/* eslint-disable linebreak-style */
import { AuditSubscriber } from './audit.subscriber';
import { RequestContext } from '../common/context/request-context';

// Minimal fake manager with only getRepository used by subscriber
interface FakeManager {
  getRepository: (e: any) => any;
}

describe('AuditSubscriber (unit-mock)', () => {
  let subscriber: AuditSubscriber;
  let saved: any[] = [];
  const repo = {
    create: (o: any) => o,
    save: async (o: any) => {
      saved.push(o);
      return o;
    },
  };
  const manager: FakeManager = { getRepository: () => repo };

  function runCtx(fn: () => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      RequestContext.run({ tenantId: 't1', userId: 'u1' }, () => {
        fn().then(resolve).catch(reject);
      });
    });
  }

  beforeEach(() => {
    subscriber = new AuditSubscriber();
    saved = [];
  });

  it('captures insert event (with context)', async () => {
    await runCtx(async () => {
      await subscriber.afterInsert({
        entity: { constructor: { name: 'Farm' }, id: 'F1', tenantId: 't1', name: 'Alpha' },
        manager,
      } as any);
    });
    expect(saved).toHaveLength(1);
    const log = saved[0];
    expect(log.action).toBe('insert');
    expect(log.entity).toBe('Farm');
    expect(log.tenantId).toBe('t1');
    expect(log.userId).toBe('u1');
    expect(log.changedKeys).toEqual(expect.arrayContaining(['id', 'tenantId', 'name']));
  });

  it('falls back to entity tenantId when no context', async () => {
    await subscriber.afterInsert({
      entity: { constructor: { name: 'Farm' }, id: 'F2', tenantId: 't2', label: 'Beta' },
      manager,
    } as any);
    expect(saved).toHaveLength(1);
    expect(saved[0].tenantId).toBe('t2');
    expect(saved[0].userId).toBeNull();
  });

  it('captures update event with changed keys diff', async () => {
    const before = { constructor: { name: 'Farm' }, id: 'F3', name: 'Old', status: 'active' };
    const after = { constructor: { name: 'Farm' }, id: 'F3', name: 'New', status: 'inactive' };
    await runCtx(async () => {
      await subscriber.afterUpdate({ entity: after, databaseEntity: before, manager } as any);
    });
    expect(saved).toHaveLength(1);
    const log = saved[0];
    expect(log.action).toBe('update');
    expect(log.changedKeys).toEqual(expect.arrayContaining(['name', 'status']));
  });

  it('produces null changedKeys on no-op update', async () => {
    const before = { constructor: { name: 'Farm' }, id: 'F4', name: 'Same', status: 'active' };
    const after = { constructor: { name: 'Farm' }, id: 'F4', name: 'Same', status: 'active' };
    await runCtx(async () => {
      await subscriber.afterUpdate({ entity: after, databaseEntity: before, manager } as any);
    });
    expect(saved).toHaveLength(1);
    expect(saved[0].changedKeys).toBeNull();
  });

  it('captures remove event', async () => {
    const prior = { constructor: { name: 'Farm' }, id: 'F5', name: 'RemoveMe', status: 'active' };
    await runCtx(async () => {
      await subscriber.afterRemove({ entity: prior, databaseEntity: prior, manager } as any);
    });
    expect(saved).toHaveLength(1);
    const log = saved[0];
    expect(log.action).toBe('remove');
    expect(log.before).toBeTruthy();
    expect(log.after).toBeNull();
  });

  it('skips non-audited entity', async () => {
    await runCtx(async () => {
      await subscriber.afterInsert({ entity: { constructor: { name: 'NonAudited' } }, manager } as any);
    });
    expect(saved).toHaveLength(0);
  });
});
