import { Test, TestingModule } from '@nestjs/testing';
import { TenantCodeCacheService } from './tenant-code-cache.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';

// Minimal in-memory mock repo
class TenantRepoMock {
  private items: Tenant[] = [];
  async findOne(opts: any): Promise<Tenant | null> {
    const where = opts.where || {};
    if (where.id) return this.items.find((t) => t.id === where.id) || null;
    if (where.code) return this.items.find((t) => t.code === where.code) || null;
    return null;
  }
  seed(tenant: Tenant) {
    this.items.push(tenant);
  }
}

describe('TenantCodeCacheService', () => {
  let service: TenantCodeCacheService;
  let repo: TenantRepoMock;

  beforeEach(async () => {
    repo = new TenantRepoMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantCodeCacheService, { provide: getRepositoryToken(Tenant), useValue: repo }],
    }).compile();
    service = module.get(TenantCodeCacheService);
  });

  it('resolves and caches by code and id with hit/miss stats', async () => {
    const tenant: Tenant = {
      id: '11111111-1111-1111-1111-111111111111',
      code: 'alpha',
      name: 'Alpha',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    } as any;
    repo.seed(tenant);
    // First resolve: miss
    const t1 = await service.resolve('alpha');
    expect(t1).toBeDefined();
    const s1 = service.snapshotStats();
    expect(s1.misses).toBe(1);
    // Second resolve (cached): hit
    const t2 = await service.resolve('alpha');
    expect(t2).toBeDefined();
    const s2 = service.snapshotStats();
    expect(s2.hits).toBe(1);
    // Resolve by id (should use cache as well and increment hit)
    const t3 = await service.resolve(tenant.id);
    expect(t3).toBeDefined();
    const s3 = service.snapshotStats();
    expect(s3.hits).toBe(2);
  });

  it('invalidates entries on demand', async () => {
    const tenant: Tenant = {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'beta',
      name: 'Beta',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    } as any;
    repo.seed(tenant);
    await service.resolve('beta'); // miss
    await service.resolve('beta'); // hit
    service.invalidate('beta');
    const after = await service.resolve('beta'); // miss again after invalidate
    expect(after).toBeDefined();
    const stats = service.snapshotStats();
    expect(stats.misses).toBeGreaterThanOrEqual(2);
  });
});
