import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../src/audit/audit-log.entity';
import { AuditSubscriber } from '../src/audit/audit.subscriber';
import { FeedingRecord } from '../src/fish-batches/entities/feeding-record.entity';
import { FishBatch } from '../src/fish-batches/entities/fish-batch.entity';
import { Tenant } from '../src/tenancy/entities/tenant.entity';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestContext } from '../src/common/context/request-context';

describe('Audit Integration (FeedingRecord CRUD)', () => {
  let moduleRef: TestingModule;
  let feedingRepo: Repository<FeedingRecord>;
  let batchRepo: Repository<FishBatch>;
  let auditRepo: Repository<AuditLog>;
  let tenantRepo: Repository<Tenant>;
  let userRepo: Repository<User>;

  const userId = '33333333-3333-3333-3333-333333333333';
  const tenantId = '44444444-4444-4444-4444-444444444444';
  let batchId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [AuditLog, FeedingRecord, FishBatch, Tenant, User],
          synchronize: true,
          subscribers: [AuditSubscriber],
        }),
        TypeOrmModule.forFeature([AuditLog, FeedingRecord, FishBatch, Tenant, User]),
      ],
      providers: [],
    }).compile();

    feedingRepo = moduleRef.get(getRepositoryToken(FeedingRecord));
    batchRepo = moduleRef.get(getRepositoryToken(FishBatch));
    auditRepo = moduleRef.get(getRepositoryToken(AuditLog));
    tenantRepo = moduleRef.get(getRepositoryToken(Tenant));
    userRepo = moduleRef.get(getRepositoryToken(User));

    await tenantRepo.save({ id: tenantId, code: 'tt', name: 'Tenant T', isActive: true } as any);
    await userRepo.save({ id: userId, email: 'user@example.com', passwordHash: 'x', isActive: true } as any);

    const batch = await batchRepo.save({
      batchNumber: 'B-001',
      species: 'Tilapia',
      initialCount: 1000,
      currentCount: 1000,
      averageWeight: 10.5,
      totalBiomass: 10500,
      stockingDate: new Date(),
      status: 'active',
      managedById: userId,
      pondId: null,
      tenantId,
    } as any);
    batchId = batch.id;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  function runWithContext<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      RequestContext.run({ tenantId, userId }, () => {
        fn().then(resolve).catch(reject);
      });
    });
  }

  it('logs insert/update/remove for FeedingRecord', async () => {
    const created = await runWithContext(() =>
      feedingRepo.save(
        feedingRepo.create({
          feedAmount: 12.5,
          feedType: 'Starter',
          feedingMethod: 'manual',
          feedingTime: '08:00:00',
          fishAppetite: 'good',
          fishBatchId: batchId,
          recordedById: userId,
          tenantId,
          cost: 25.75,
        }),
      ),
    );
    const insertLogs = await auditRepo.find({ where: { entityId: created.id, action: 'insert' } });
    expect(insertLogs.length).toBe(1);

    await runWithContext(() =>
      feedingRepo.save({ id: created.id, notes: 'Adjusted feed', feedAmount: 13.0 } as any),
    );
    const updateLogs = await auditRepo.find({ where: { entityId: created.id, action: 'update' } });
    expect(updateLogs.length).toBe(1);
    expect(updateLogs[0].changedKeys).toEqual(expect.arrayContaining(['notes', 'feedAmount']));

    await runWithContext(() => feedingRepo.remove({ id: created.id } as any));
    const removeLogs = await auditRepo.find({ where: { entityId: created.id, action: 'remove' } });
    expect(removeLogs.length).toBe(1);
    expect(removeLogs[0].before).toBeTruthy();
  });
});
