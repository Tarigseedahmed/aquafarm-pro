import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AuditLog],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([AuditLog]),
      ],
      providers: [AuditService],
    }).compile();
    service = module.get(AuditService);
  });

  it('creates audit log record', async () => {
    const created = await service.log({ entity: 'Farm', action: 'insert', after: { name: 'A' } });
    expect(created.id).toBeDefined();
    const list = await service.list({ entity: 'Farm' });
    expect(list.data.length).toBeGreaterThanOrEqual(1);
  });
});
