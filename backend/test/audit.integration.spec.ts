import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../src/audit/audit-log.entity';
import { AuditSubscriber } from '../src/audit/audit.subscriber';
import { Farm } from '../src/farms/entities/farm.entity';
import { FarmsService } from '../src/farms/farms.service';
import { Tenant } from '../src/tenancy/entities/tenant.entity';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../src/audit/audit.service';
import { PinoLoggerService } from '../src/common/logging/pino-logger.service';
import { RequestContext } from '../src/common/context/request-context';

class NoopLogger {
  info() {}
  error() {}
  warn() {}
  debug() {}
}

describe('Audit Integration (Farm CRUD)', () => {
  let moduleRef: TestingModule;
  let farmsService: FarmsService;
  let auditRepo: Repository<AuditLog>;
  let tenantRepo: Repository<Tenant>;
  let userRepo: Repository<User>;

  const ownerId = '11111111-1111-1111-1111-111111111111';
  const tenantId = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [AuditLog, Farm, Tenant, User],
          synchronize: true,
          subscribers: [AuditSubscriber],
        }),
        TypeOrmModule.forFeature([AuditLog, Farm, Tenant, User]),
      ],
      providers: [
        AuditService,
        FarmsService,
        AuditSubscriber,
        { provide: PinoLoggerService, useClass: NoopLogger },
      ],
    }).compile();

    farmsService = moduleRef.get(FarmsService);
    auditRepo = moduleRef.get(getRepositoryToken(AuditLog));
    tenantRepo = moduleRef.get(getRepositoryToken(Tenant));
    userRepo = moduleRef.get(getRepositoryToken(User));

    await tenantRepo.save({ id: tenantId, code: 'tst', name: 'Test Tenant', isActive: true } as any);
    await userRepo.save({ id: ownerId, email: 'owner@example.com', passwordHash: 'x', isActive: true } as any);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  function runWithContext<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      RequestContext.run({ tenantId, userId: ownerId }, () => {
        fn().then(resolve).catch(reject);
      });
    });
  }

  it('logs insert/update/remove events for Farm', async () => {
    const created = await runWithContext(() =>
      farmsService.create(
        {
          name: 'Farm A',
          location: 'Loc',
          farmType: 'freshwater',
          status: 'active',
        } as any,
        ownerId,
        tenantId,
      ),
    );

    const afterInsertLogs = await auditRepo.find({ where: { entityId: created.id, action: 'insert' } });
    expect(afterInsertLogs.length).toBe(1);
    expect(afterInsertLogs[0].after).toBeTruthy();

    await runWithContext(() =>
      farmsService.update(
        created.id,
        { description: 'Updated desc', status: 'inactive', location: 'NewLoc' } as any,
        ownerId,
        tenantId,
      ),
    );
    const afterUpdateLogs = await auditRepo.find({ where: { entityId: created.id, action: 'update' } });
    expect(afterUpdateLogs.length).toBe(1);
    expect(afterUpdateLogs[0].changedKeys).toEqual(
      expect.arrayContaining(['description', 'status', 'location']),
    );
    expect(afterUpdateLogs[0].changedKeys!.length).toBeGreaterThanOrEqual(3); // may include updatedAt

    await runWithContext(() => farmsService.remove(created.id, ownerId, tenantId));
    const afterRemoveLogs = await auditRepo.find({ where: { entityId: created.id, action: 'remove' } });
    expect(afterRemoveLogs.length).toBe(1);
    expect(afterRemoveLogs[0].before).toBeTruthy();
  });
});
