import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Farm } from '../src/farms/entities/farm.entity';
import { Pond } from '../src/ponds/entities/pond.entity';
import { WaterQualityReading } from '../src/water-quality/entities/water-quality-reading.entity';
import { FishBatch } from '../src/fish-batches/entities/fish-batch.entity';
import { FeedingRecord } from '../src/fish-batches/entities/feeding-record.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { Tenant } from '../src/tenancy/entities/tenant.entity';

// Ensures we don't accidentally ship duplicate migration names or miss critical columns

describe('Migration Integrity', () => {
  let ds: DataSource;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    const isTs = __filename.endsWith('.ts');
    ds = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        User,
        Farm,
        Pond,
        WaterQualityReading,
        FishBatch,
        FeedingRecord,
        Notification,
        Tenant,
      ],
      synchronize: false,
      logging: false,
      migrations: [isTs ? 'src/database/migrations/*.ts' : 'dist/database/migrations/*.js'],
    });
    await ds.initialize();
    await ds.runMigrations();
  });

  afterAll(async () => {
    if (ds && ds.isInitialized) await ds.destroy();
  });

  it('has unique migration names', () => {
    const names = ds.migrations.map((m) => m.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toHaveLength(0);
  });

  it('users table includes tenantId column (nullable)', async () => {
    const has = await ds.query(`PRAGMA table_info('users')`);
    const tenantCol = has.find((r: any) => r.name === 'tenantId');
    expect(tenantCol).toBeDefined();
  });
});
