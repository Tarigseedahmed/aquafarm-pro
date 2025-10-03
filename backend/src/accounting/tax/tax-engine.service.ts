import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxRate } from '../entities/tax-rate.entity';
import { FxRate } from '../entities/fx-rate.entity';

export interface TaxCalculationRequest {
  amount: number;
  currency: string;
  taxCode: string;
  countryCode: string;
  date: string; // ISO date
  isInclusive?: boolean; // true if amount includes tax
}

export interface TaxCalculationResult {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  taxCode: string;
  currency: string;
  isInclusive: boolean;
  breakdown: {
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
}

export interface TaxSummary {
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  currency: string;
  taxBreakdown: Array<{
    taxCode: string;
    taxRate: number;
    baseAmount: number;
    taxAmount: number;
  }>;
}

@Injectable()
export class TaxEngineService {
  private readonly logger = new Logger(TaxEngineService.name);

  constructor(
    @InjectRepository(TaxProfile)
    private taxProfileRepository: Repository<TaxProfile>,
    @InjectRepository(TaxRate)
    private taxRateRepository: Repository<TaxRate>,
    @InjectRepository(FxRate)
    private fxRateRepository: Repository<FxRate>,
  ) {}

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    const { amount, currency, taxCode, countryCode, isInclusive = false } = request; // 'date' not used in core calc

    // Get tax rate
    const taxRate = await this.taxRateRepository.findOne({
      where: {
        code: taxCode,
        countryCode,
        tenantId: null, // Global rates for now
      },
    });

    if (!taxRate) {
      throw new Error(`Tax rate not found for code: ${taxCode} in country: ${countryCode}`);
    }

    const rate = parseFloat(taxRate.ratePercent.toString()) / 100;

    let baseAmount: number;
    let taxAmount: number;
    let totalAmount: number;

    if (isInclusive) {
      // Amount includes tax
      totalAmount = amount;
      baseAmount = amount / (1 + rate);
      taxAmount = totalAmount - baseAmount;
    } else {
      // Amount excludes tax
      baseAmount = amount;
      taxAmount = baseAmount * rate;
      totalAmount = baseAmount + taxAmount;
    }

    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      taxRate: rate,
      taxCode,
      currency,
      isInclusive,
      breakdown: {
        baseAmount: Math.round(baseAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    };
  }

  async calculateTaxWithCurrencyConversion(
    request: TaxCalculationRequest,
    targetCurrency: string,
  ): Promise<TaxCalculationResult> {
    const { currency, date } = request;

    // If same currency, no conversion needed
    if (currency === targetCurrency) {
      return this.calculateTax(request);
    }

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate(currency, targetCurrency, date);
    if (!exchangeRate) {
      throw new Error(`Exchange rate not found for ${currency} to ${targetCurrency} on ${date}`);
    }

    // Convert amount to target currency
    const convertedAmount = request.amount * parseFloat(exchangeRate.rate);
    const convertedRequest = { ...request, amount: convertedAmount, currency: targetCurrency };

    return this.calculateTax(convertedRequest);
  }

  async generateTaxSummary(
    calculations: TaxCalculationResult[],
    currency: string,
  ): Promise<TaxSummary> {
    const taxBreakdown = new Map<
      string,
      { taxRate: number; baseAmount: number; taxAmount: number }
    >();

    let totalBaseAmount = 0;
    let totalTaxAmount = 0;

    for (const calc of calculations) {
      totalBaseAmount += calc.baseAmount;
      totalTaxAmount += calc.taxAmount;

      const existing = taxBreakdown.get(calc.taxCode);
      if (existing) {
        existing.baseAmount += calc.baseAmount;
        existing.taxAmount += calc.taxAmount;
      } else {
        taxBreakdown.set(calc.taxCode, {
          taxRate: calc.taxRate,
          baseAmount: calc.baseAmount,
          taxAmount: calc.taxAmount,
        });
      }
    }

    return {
      totalBaseAmount: Math.round(totalBaseAmount * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      totalAmount: Math.round((totalBaseAmount + totalTaxAmount) * 100) / 100,
      currency,
      taxBreakdown: Array.from(taxBreakdown.entries()).map(([taxCode, data]) => ({
        taxCode,
        taxRate: data.taxRate,
        baseAmount: Math.round(data.baseAmount * 100) / 100,
        taxAmount: Math.round(data.taxAmount * 100) / 100,
      })),
    };
  }

  async getAvailableTaxRates(countryCode: string): Promise<TaxRate[]> {
    return this.taxRateRepository.find({
      where: { countryCode, tenantId: null },
      order: { code: 'ASC' },
    });
  }

  async getTaxProfiles(): Promise<TaxProfile[]> {
    return this.taxProfileRepository.find({
      where: { tenantId: null },
      order: { countryCode: 'ASC' },
    });
  }

  private async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date: string,
  ): Promise<FxRate | null> {
    // Align with unified FxRate schema (baseCurrency, quoteCurrency, effectiveDate)
    return this.fxRateRepository.findOne({
      where: {
        baseCurrency: fromCurrency.toUpperCase(),
        quoteCurrency: toCurrency.toUpperCase(),
        effectiveDate: date,
      },
    });
  }

  async validateTaxCode(taxCode: string, countryCode: string): Promise<boolean> {
    const taxRate = await this.taxRateRepository.findOne({
      where: {
        code: taxCode,
        countryCode,
        tenantId: null,
      },
    });

    return !!taxRate;
  }

  async getTaxRateInfo(
    taxCode: string,
    countryCode: string,
  ): Promise<{
    code: string;
    description: string;
    ratePercent: number;
    validFrom: string;
    isCompound: boolean;
  } | null> {
    const taxRate = await this.taxRateRepository.findOne({
      where: {
        code: taxCode,
        countryCode,
        tenantId: null,
      },
    });

    if (!taxRate) return null;

    return {
      code: taxRate.code,
      description: taxRate.description,
      ratePercent: parseFloat(taxRate.ratePercent.toString()),
      validFrom: taxRate.validFrom,
      isCompound: taxRate.isCompound,
    };
  }
}
