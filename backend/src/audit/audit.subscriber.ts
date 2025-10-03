import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { RequestContext } from '../common/context/request-context';

const AUDITED_ENTITIES = new Set([
  'Farm',
  'Pond',
  'WaterQualityReading',
  'FishBatch',
  'FeedingRecord',
  'User',
  'Tenant',
  'Notification',
]);

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<any> {
  listenTo() {
    return Object; // manual filtering
  }

  private isAudited(target: any): boolean {
    const name = target?.constructor?.name;
    return !!name && AUDITED_ENTITIES.has(name);
  }

  async afterInsert(event: InsertEvent<any>) {
    if (!this.isAudited(event.entity)) return;
    const ctx = RequestContext.get();
    const repo = event.manager.getRepository(AuditLog);
    await repo.save(
      repo.create({
        entity: event.entity.constructor.name,
        entityId: (event.entity as any).id || null,
        action: 'insert',
        before: null,
        after: this.safeStrip(event.entity),
        changedKeys: Object.keys(event.entity || {}),
        tenantId: ctx?.tenantId || (event.entity as any)?.tenantId || null,
        userId: ctx?.userId || null,
      }),
    );
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (!this.isAudited(event.entity || event.databaseEntity)) return;
    const ctx = RequestContext.get();
    const repo = event.manager.getRepository(AuditLog);
    const before = this.safeStrip(event.databaseEntity);
    const after = this.safeStrip(event.entity);
    const changed: string[] = [];
    if (before && after) {
      for (const k of Object.keys(after)) {
        if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.push(k);
      }
    }
    await repo.save(
      repo.create({
        entity: (event.entity || event.databaseEntity).constructor.name,
        entityId: ((event.entity || event.databaseEntity) as any).id || null,
        action: 'update',
        before,
        after,
        changedKeys: changed.length ? changed : null,
        tenantId:
          ctx?.tenantId ||
          (event.entity as any)?.tenantId ||
          (event.databaseEntity as any)?.tenantId ||
          null,
        userId: ctx?.userId || null,
      }),
    );
  }

  async afterRemove(event: RemoveEvent<any>) {
    if (!this.isAudited(event.entity || event.databaseEntity)) return;
    const ctx = RequestContext.get();
    const repo = event.manager.getRepository(AuditLog);
    await repo.save(
      repo.create({
        entity: (event.entity || event.databaseEntity).constructor.name,
        entityId: ((event.entity || event.databaseEntity) as any).id || null,
        action: 'remove',
        before: this.safeStrip(event.databaseEntity || event.entity),
        after: null,
        changedKeys: null,
        tenantId:
          ctx?.tenantId ||
          (event.entity as any)?.tenantId ||
          (event.databaseEntity as any)?.tenantId ||
          null,
        userId: ctx?.userId || null,
      }),
    );
  }

  private safeStrip(obj: any) {
    if (!obj || typeof obj !== 'object') return obj || null;
    const clone: any = {};
    for (const k of Object.keys(obj)) {
      if (k.startsWith('__')) continue;
      if (typeof obj[k] === 'function') continue;
      clone[k] = obj[k];
    }
    return clone;
  }
}
