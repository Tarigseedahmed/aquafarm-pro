import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxRate } from './entities/fx-rate.entity';
import { FxRatesService } from './fx-rates.service';

describe('FxRatesService', () => {
  let service: FxRatesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [FxRate],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([FxRate]),
      ],
      providers: [FxRatesService],
    }).compile();
    service = moduleRef.get(FxRatesService);
  });

  it('upserts and retrieves a rate', async () => {
    const d = '2025-10-01';
    const created = await service.upsertRate('usd', 'sar', d, '3.7500');
    expect(created.id).toBeDefined();
    expect(created.baseCurrency).toBe('USD');
    expect(created.quoteCurrency).toBe('SAR');

    const fetched = await service.getRate('USD', 'SAR', d);
    expect(fetched).toBeDefined();
    expect(fetched?.rate).toBe('3.7500');
  });

  it('updates existing rate on duplicate upsert', async () => {
    const d = '2025-10-02';
    await service.upsertRate('usd', 'sar', d, '3.7500');
    await service.upsertRate('USD', 'SAR', d, '3.7600');
    const fetched = await service.getRate('usd', 'sar', d);
    expect(fetched?.rate).toBe('3.7600');
  });

  it('latest returns the most recent effectiveDate', async () => {
    await service.upsertRate('usd', 'sar', '2025-09-30', '3.7400');
    await service.upsertRate('usd', 'sar', '2025-10-03', '3.7650');
    const latest = await service.latest('usd', 'sar');
    expect(latest?.effectiveDate).toBe('2025-10-03');
  });
});
