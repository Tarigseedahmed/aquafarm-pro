import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FxRate } from './entities/fx-rate.entity';

@Injectable()
export class FxRatesService {
  private readonly logger = new Logger(FxRatesService.name);

  constructor(
    @InjectRepository(FxRate)
    private readonly fxRepo: Repository<FxRate>,
  ) {}

  async upsertRate(base: string, quote: string, rateDate: string, rate: string) {
    const baseCurrency = base.toUpperCase();
    const quoteCurrency = quote.toUpperCase();
    const effectiveDate = rateDate; // semantic rename
    const existing = await this.fxRepo.findOne({
      where: { baseCurrency, quoteCurrency, effectiveDate },
    });
    if (existing) {
      existing.rate = rate;
      return this.fxRepo.save(existing);
    }
    const fx = this.fxRepo.create({
      baseCurrency,
      quoteCurrency,
      effectiveDate,
      rate,
      source: 'MANUAL',
    });
    return this.fxRepo.save(fx);
  }

  async getRate(base: string, quote: string, rateDate: string): Promise<FxRate | null> {
    return this.fxRepo.findOne({
      where: {
        baseCurrency: base.toUpperCase(),
        quoteCurrency: quote.toUpperCase(),
        effectiveDate: rateDate,
      },
    });
  }

  async latest(base: string, quote: string): Promise<FxRate | null> {
    return this.fxRepo.findOne({
      where: {
        baseCurrency: base.toUpperCase(),
        quoteCurrency: quote.toUpperCase(),
      },
      order: { effectiveDate: 'DESC' },
    });
  }

  // Simple external fetcher (placeholder) — expects JSON { rate: number }
  async fetchFromProvider(base: string, quote: string): Promise<string> {
    const url = process.env.FX_PROVIDER_URL || '';
    if (!url) throw new Error('FX_PROVIDER_URL not configured');
    const res = await fetch(
      `${url}?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`,
    );
    if (!res.ok) throw new Error(`FX provider error: ${res.status}`);
    const data = (await res.json()) as { rate: number };
    return String(data.rate);
  }

  async syncPair(base: string, quote: string, rateDate: string) {
    const rate = await this.fetchFromProvider(base, quote);
    return this.upsertRate(base, quote, rateDate, rate);
  }
}
