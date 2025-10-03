import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FxRate } from '../entities/fx-rate.entity';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  rateDate: string;
}

export interface ExchangeGainLoss {
  transactionId: string;
  originalCurrency: string;
  functionalCurrency: string;
  originalAmount: number;
  functionalAmount: number;
  exchangeRate: number;
  gainLossAmount: number;
  gainLossType: 'GAIN' | 'LOSS';
  rateDate: string;
}

export interface MultiCurrencyTransaction {
  id: string;
  originalCurrency: string;
  functionalCurrency: string;
  originalAmount: number;
  functionalAmount: number;
  exchangeRate: number;
  rateDate: string;
  description: string;
  accountId: string;
}

@Injectable()
export class MultiCurrencyService {
  private readonly logger = new Logger(MultiCurrencyService.name);

  constructor(
    @InjectRepository(FxRate)
    private fxRateRepository: Repository<FxRate>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
  ) {}

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    rateDate: string,
  ): Promise<CurrencyConversion> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        amount,
        rate: 1,
        convertedAmount: amount,
        rateDate,
      };
    }

  const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency, rateDate);
    if (!exchangeRate) {
      throw new Error(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${rateDate}`,
      );
    }

  const rate = parseFloat(exchangeRate.rate);
    const convertedAmount = amount * rate;

    return {
      fromCurrency,
      toCurrency,
      amount,
      rate,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rateDate,
    };
  }

  /**
   * Calculate exchange gain/loss for a transaction
   */
  async calculateExchangeGainLoss(
    transactionId: string,
    originalCurrency: string,
    functionalCurrency: string,
    originalAmount: number,
    transactionDate: string,
    settlementDate: string,
  ): Promise<ExchangeGainLoss> {
    // Get exchange rate on transaction date
    const transactionRate = await this.getExchangeRate(
      originalCurrency,
      functionalCurrency,
      transactionDate,
    );
    if (!transactionRate) {
      throw new Error(`Exchange rate not found for transaction date: ${transactionDate}`);
    }

    // Get exchange rate on settlement date
    const settlementRate = await this.getExchangeRate(
      originalCurrency,
      functionalCurrency,
      settlementDate,
    );
    if (!settlementRate) {
      throw new Error(`Exchange rate not found for settlement date: ${settlementDate}`);
    }

  const transactionRateValue = parseFloat(transactionRate.rate);
  const settlementRateValue = parseFloat(settlementRate.rate);

    const functionalAmountAtTransaction = originalAmount * transactionRateValue;
    const functionalAmountAtSettlement = originalAmount * settlementRateValue;

    const gainLossAmount = functionalAmountAtSettlement - functionalAmountAtTransaction;
    const gainLossType = gainLossAmount >= 0 ? 'GAIN' : 'LOSS';

    return {
      transactionId,
      originalCurrency,
      functionalCurrency,
      originalAmount,
      functionalAmount: functionalAmountAtSettlement,
      exchangeRate: settlementRateValue,
      gainLossAmount: Math.round(Math.abs(gainLossAmount) * 100) / 100,
      gainLossType,
      rateDate: settlementDate,
    };
  }

  /**
   * Record exchange gain/loss in journal entries
   */
  async recordExchangeGainLoss(
    tenantId: string,
    gainLoss: ExchangeGainLoss,
    description: string,
  ): Promise<JournalEntry> {
    // Find exchange gain/loss accounts
    const exchangeGainAccount = await this.chartOfAccountsRepository.findOne({
      where: { code: '5410', tenantId }, // Exchange Gain account
    });

    const exchangeLossAccount = await this.chartOfAccountsRepository.findOne({
      where: { code: '5420', tenantId }, // Exchange Loss account
    });

    if (!exchangeGainAccount || !exchangeLossAccount) {
      throw new Error('Exchange gain/loss accounts not found');
    }

    const journalEntry = this.journalEntryRepository.create({
      tenantId,
      reference: `EX-${gainLoss.transactionId}`,
      transactionDate: gainLoss.rateDate,
      currency: gainLoss.functionalCurrency,
      description: `${description} - ${gainLoss.gainLossType}`,
      totalDebit: gainLoss.gainLossAmount,
      totalCredit: gainLoss.gainLossAmount,
    });

    const savedEntry = await this.journalEntryRepository.save(journalEntry);

    // Create journal entry lines
    if (gainLoss.gainLossType === 'GAIN') {
      // Debit exchange gain account
      await this.journalEntryLineRepository.save(
        this.journalEntryLineRepository.create({
          journalEntryId: savedEntry.id,
          accountId: exchangeGainAccount.id,
          debit: gainLoss.gainLossAmount,
          credit: 0,
          description: `Exchange gain for transaction ${gainLoss.transactionId}`,
        }),
      );

      // Credit cash/bank account (assuming cash account for simplicity)
      const cashAccount = await this.chartOfAccountsRepository.findOne({
        where: { code: '1110', tenantId }, // Cash account
      });

      if (cashAccount) {
        await this.journalEntryLineRepository.save(
          this.journalEntryLineRepository.create({
            journalEntryId: savedEntry.id,
            accountId: cashAccount.id,
            debit: 0,
            credit: gainLoss.gainLossAmount,
            description: `Exchange gain for transaction ${gainLoss.transactionId}`,
          }),
        );
      }
    } else {
      // Debit exchange loss account
      await this.journalEntryLineRepository.save(
        this.journalEntryLineRepository.create({
          journalEntryId: savedEntry.id,
          accountId: exchangeLossAccount.id,
          debit: gainLoss.gainLossAmount,
          credit: 0,
          description: `Exchange loss for transaction ${gainLoss.transactionId}`,
        }),
      );

      // Credit cash/bank account
      const cashAccount = await this.chartOfAccountsRepository.findOne({
        where: { code: '1110', tenantId }, // Cash account
      });

      if (cashAccount) {
        await this.journalEntryLineRepository.save(
          this.journalEntryLineRepository.create({
            journalEntryId: savedEntry.id,
            accountId: cashAccount.id,
            debit: 0,
            credit: gainLoss.gainLossAmount,
            description: `Exchange loss for transaction ${gainLoss.transactionId}`,
          }),
        );
      }
    }

    return savedEntry;
  }

  /**
   * Get exchange rate for currency pair on specific date
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date: string,
  ): Promise<FxRate | null> {
    return this.fxRateRepository.findOne({
      where: {
        baseCurrency: fromCurrency.toUpperCase(),
        quoteCurrency: toCurrency.toUpperCase(),
        effectiveDate: date,
      },
    });
  }

  /**
   * Get latest exchange rate for currency pair
   */
  async getLatestExchangeRate(fromCurrency: string, toCurrency: string): Promise<FxRate | null> {
    return this.fxRateRepository.findOne({
      where: {
        baseCurrency: fromCurrency.toUpperCase(),
        quoteCurrency: toCurrency.toUpperCase(),
      },
      order: { effectiveDate: 'DESC' },
    });
  }

  /**
   * Get exchange rate history for currency pair
   */
  async getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FxRate[]> {
    const query = this.fxRateRepository
      .createQueryBuilder('fx')
      .where('fx.baseCurrency = :base', { base: fromCurrency.toUpperCase() })
      .andWhere('fx.quoteCurrency = :quote', { quote: toCurrency.toUpperCase() });

    if (startDate) {
  query.andWhere('fx.effectiveDate >= :startDate', { startDate });
    }

    if (endDate) {
  query.andWhere('fx.effectiveDate <= :endDate', { endDate });
    }

  return query.orderBy('fx.effectiveDate', 'DESC').getMany();
  }

  /**
   * Calculate average exchange rate for a period
   */
  async getAverageExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const rates = await this.getExchangeRateHistory(fromCurrency, toCurrency, startDate, endDate);

    if (rates.length === 0) {
      throw new Error('No exchange rates found for the specified period');
    }

    const totalRate = rates.reduce((sum, rate) => sum + parseFloat(rate.rate), 0);
    return Math.round((totalRate / rates.length) * 1000000) / 1000000; // 6 decimal places
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const currencies = await this.fxRateRepository
      .createQueryBuilder('fx')
  .select('DISTINCT fx.baseCurrency', 'currency')
      .getRawMany();

    return currencies.map((c) => c.currency);
  }

  /**
   * Validate currency code
   */
  isValidCurrencyCode(currency: string): boolean {
    return /^[A-Z]{3}$/.test(currency);
  }

  /**
   * Get currency conversion summary
   */
  async getCurrencyConversionSummary(
    tenantId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    totalConversions: number;
    totalGainLoss: number;
    gainLossBreakdown: Array<{
      currency: string;
      gainAmount: number;
      lossAmount: number;
      netGainLoss: number;
    }>;
  }> {
    // This would typically query journal entries for exchange gain/loss
    // For now, return a mock structure
    void tenantId;
    void startDate;
    void endDate;
    return {
      totalConversions: 0,
      totalGainLoss: 0,
      gainLossBreakdown: [],
    };
  }

  /**
   * Revalue foreign currency balances
   */
  async revalueForeignCurrencyBalances(
    tenantId: string,
    revaluationDate: string,
    functionalCurrency: string,
  ): Promise<{
    revaluedAccounts: Array<{
      accountId: string;
      accountCode: string;
      originalCurrency: string;
      originalBalance: number;
      functionalBalance: number;
      exchangeRate: number;
      gainLoss: number;
    }>;
    totalGainLoss: number;
  }> {
    // This would typically revalue all foreign currency account balances
    // For now, return a mock structure
    void tenantId;
    void revaluationDate;
    void functionalCurrency;
    return {
      revaluedAccounts: [],
      totalGainLoss: 0,
    };
  }
}
