import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxEngineService } from './tax-engine.service';
import { TaxRate } from '../entities/tax-rate.entity';
import { TaxProfile } from '../entities/tax-profile.entity';
import { FxRate } from '../entities/fx-rate.entity';

describe('TaxEngineService', () => {
  let service: TaxEngineService;
  let taxRateRepo: Repository<TaxRate>;
  let fxRepo: Repository<FxRate>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [TaxRate, TaxProfile, FxRate],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([TaxRate, TaxProfile, FxRate]),
      ],
      providers: [TaxEngineService],
    }).compile();

    service = moduleRef.get(TaxEngineService);
    taxRateRepo = moduleRef.get(getRepositoryToken(TaxRate));
    fxRepo = moduleRef.get(getRepositoryToken(FxRate));

    // Seed a global VAT standard 15% for SA
    await taxRateRepo.save(
      taxRateRepo.create({
        code: 'VAT_STANDARD',
        countryCode: 'SA',
        description: 'Standard VAT 15%',
        ratePercent: '15.0000',
        validFrom: '2025-01-01',
        isCompound: false,
        tenantId: null,
      }),
    );
  });

  it('calculates tax (exclusive) correctly', async () => {
    const result = await service.calculateTax({
      amount: 100,
      currency: 'SAR',
      taxCode: 'VAT_STANDARD',
      countryCode: 'SA',
      date: '2025-10-01',
      isInclusive: false,
    });
    expect(result.baseAmount).toBe(100);
    expect(result.taxAmount).toBe(15); // 15%
    expect(result.totalAmount).toBe(115);
    expect(result.taxRate).toBe(0.15);
  });

  it('calculates tax (inclusive) correctly', async () => {
    const result = await service.calculateTax({
      amount: 115,
      currency: 'SAR',
      taxCode: 'VAT_STANDARD',
      countryCode: 'SA',
      date: '2025-10-01',
      isInclusive: true,
    });
    expect(result.totalAmount).toBe(115);
    expect(result.baseAmount).toBe(100); // 115 / 1.15
    expect(result.taxAmount).toBe(15);
  });

  it('converts currency then applies tax', async () => {
    // Seed FX rate USD->SAR for date
    await fxRepo.save(
      fxRepo.create({
        baseCurrency: 'USD',
        quoteCurrency: 'SAR',
        rate: '3.7500',
        effectiveDate: '2025-10-02',
        source: 'MANUAL',
      }),
    );

    const result = await service.calculateTaxWithCurrencyConversion(
      {
        amount: 10, // USD
        currency: 'USD',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2025-10-02',
        isInclusive: false,
      },
      'SAR',
    );

    // Converted base = 10 * 3.75 = 37.5; tax 15% = 5.625 => rounded 5.63; total 43.13
    expect(result.currency).toBe('SAR');
    expect(result.baseAmount).toBe(37.5);
    expect(result.taxAmount).toBe(5.63);
    expect(result.totalAmount).toBe(43.13);
  });

  it('short-circuits conversion when target currency equals source', async () => {
    const spy = jest.spyOn<any, any>(service as any, 'getExchangeRate');
    const result = await service.calculateTaxWithCurrencyConversion(
      {
        amount: 200,
        currency: 'SAR',
        taxCode: 'VAT_STANDARD',
        countryCode: 'SA',
        date: '2025-10-03',
      },
      'SAR',
    );
    expect(spy).not.toHaveBeenCalled();
    expect(result.baseAmount).toBe(200);
    expect(result.taxAmount).toBe(30);
  });

  it('throws if exchange rate missing for conversion', async () => {
    await expect(
      service.calculateTaxWithCurrencyConversion(
        {
          amount: 5,
          currency: 'USD',
          taxCode: 'VAT_STANDARD',
          countryCode: 'SA',
          date: '2025-10-05',
        },
        'SAR',
      ),
    ).rejects.toThrow(/Exchange rate not found/);
  });

  it('validates tax code existence', async () => {
    await expect(service.validateTaxCode('VAT_STANDARD', 'SA')).resolves.toBe(true);
    await expect(service.validateTaxCode('UNKNOWN_CODE', 'SA')).resolves.toBe(false);
  });

  it('gets tax rate info payload', async () => {
    const info = await service.getTaxRateInfo('VAT_STANDARD', 'SA');
    expect(info).toBeDefined();
    expect(info?.code).toBe('VAT_STANDARD');
    expect(info?.ratePercent).toBe(15);
    expect(info?.isCompound).toBe(false);
  });
});
