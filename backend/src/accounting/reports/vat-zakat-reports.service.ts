import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts, AccountType } from '../entities/chart-of-accounts.entity';
import { TaxRate } from '../entities/tax-rate.entity';

export interface VATReport {
  period: string;
  totalSales: number;
  totalPurchases: number;
  vatCollected: number;
  vatPaid: number;
  vatPayable: number;
  breakdown: Array<{
    taxCode: string;
    description: string;
    rate: number;
    salesAmount: number;
    vatAmount: number;
  }>;
}

export interface ZakatReport {
  period: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  zakatableAssets: number;
  zakatRate: number;
  zakatAmount: number;
  assetBreakdown: Array<{
    accountCode: string;
    accountName: string;
    balance: number;
    isZakatable: boolean;
    zakatableAmount: number;
  }>;
}

export interface TaxSummaryReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxLiability: number;
  effectiveTaxRate: number;
  breakdown: Array<{
    category: string;
    amount: number;
    taxAmount: number;
    taxRate: number;
  }>;
}

@Injectable()
export class VATZakatReportsService {
  private readonly logger = new Logger(VATZakatReportsService.name);

  constructor(
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepository: Repository<JournalEntryLine>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(TaxRate)
    private taxRateRepository: Repository<TaxRate>,
  ) {}

  /**
   * Generate VAT report for a period
   */
  async generateVATReport(
    tenantId: string,
    startDate: string,
    endDate: string,
    countryCode: string = 'SA',
  ): Promise<VATReport> {
    // Get VAT rates for the country
    const vatRates = await this.taxRateRepository.find({
      where: { countryCode, tenantId },
    });

    // Get sales accounts (Revenue accounts)
    const salesAccounts = await this.chartOfAccountsRepository.find({
      where: { type: AccountType.REVENUE, tenantId },
    });

    // Get purchase accounts (Expense accounts)
    const purchaseAccounts = await this.chartOfAccountsRepository.find({
      where: { type: AccountType.EXPENSE, tenantId },
    });

    // Calculate sales and VAT collected
    let totalSales = 0;
    let vatCollected = 0;
    const salesBreakdown: Array<{
      taxCode: string;
      description: string;
      rate: number;
      salesAmount: number;
      vatAmount: number;
    }> = [];

    for (const account of salesAccounts) {
      const salesAmount = await this.getAccountBalance(account.id, startDate, endDate, 'CREDIT');

      if (salesAmount > 0) {
        totalSales += salesAmount;

        // Calculate VAT for each rate
        for (const vatRate of vatRates) {
          const rate = parseFloat(vatRate.ratePercent.toString()) / 100;
          const vatAmount = salesAmount * rate;

          salesBreakdown.push({
            taxCode: vatRate.code,
            description: vatRate.description,
            rate: rate * 100,
            salesAmount,
            vatAmount,
          });

          vatCollected += vatAmount;
        }
      }
    }

    // Calculate purchases and VAT paid
    let totalPurchases = 0;
    let vatPaid = 0;

    for (const account of purchaseAccounts) {
      const purchaseAmount = await this.getAccountBalance(account.id, startDate, endDate, 'DEBIT');

      if (purchaseAmount > 0) {
        totalPurchases += purchaseAmount;

        // Calculate VAT for each rate
        for (const vatRate of vatRates) {
          const rate = parseFloat(vatRate.ratePercent.toString()) / 100;
          const vatAmount = purchaseAmount * rate;
          vatPaid += vatAmount;
        }
      }
    }

    const vatPayable = vatCollected - vatPaid;

    return {
      period: `${startDate} to ${endDate}`,
      totalSales,
      totalPurchases,
      vatCollected,
      vatPaid,
      vatPayable,
      breakdown: salesBreakdown,
    };
  }

  /**
   * Generate Zakat report for a period
   */
  async generateZakatReport(
    tenantId: string,
    reportDate: string,
    zakatRate: number = 2.5, // 2.5% default Zakat rate
  ): Promise<ZakatReport> {
    // Get all accounts
    const accounts = await this.chartOfAccountsRepository.find({
      where: { tenantId },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let zakatableAssets = 0;
    const assetBreakdown: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
      isZakatable: boolean;
      zakatableAmount: number;
    }> = [];

    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, reportDate, reportDate, 'BALANCE');

      if (balance !== 0) {
        const isZakatable = this.isZakatableAccount(account);
        const zakatableAmount = isZakatable ? Math.abs(balance) : 0;

        assetBreakdown.push({
          accountCode: account.code,
          accountName: account.name,
          balance,
          isZakatable,
          zakatableAmount,
        });

        if (account.type === 'ASSET') {
          totalAssets += balance;
          if (isZakatable) {
            zakatableAssets += zakatableAmount;
          }
        } else if (account.type === 'LIABILITY') {
          totalLiabilities += Math.abs(balance);
        }
      }
    }

    const netWorth = totalAssets - totalLiabilities;
    const zakatAmount = (zakatableAssets * zakatRate) / 100;

    return {
      period: reportDate,
      totalAssets,
      totalLiabilities,
      netWorth,
      zakatableAssets,
      zakatRate,
      zakatAmount,
      assetBreakdown,
    };
  }

  /**
   * Generate tax summary report
   */
  async generateTaxSummaryReport(
    tenantId: string,
    startDate: string,
    endDate: string,
    countryCode: string = 'SA',
  ): Promise<TaxSummaryReport> {
    // Get revenue and expense accounts
    const revenueAccounts = await this.chartOfAccountsRepository.find({
      where: { type: AccountType.REVENUE, tenantId },
    });

    const expenseAccounts = await this.chartOfAccountsRepository.find({
      where: { type: AccountType.EXPENSE, tenantId },
    });

    // Calculate total revenue
    let totalRevenue = 0;
    for (const account of revenueAccounts) {
      const balance = await this.getAccountBalance(account.id, startDate, endDate, 'CREDIT');
      totalRevenue += balance;
    }

    // Calculate total expenses
    let totalExpenses = 0;
    for (const account of expenseAccounts) {
      const balance = await this.getAccountBalance(account.id, startDate, endDate, 'DEBIT');
      totalExpenses += balance;
    }

    const netIncome = totalRevenue - totalExpenses;

    // Get applicable tax rates
    const taxRates = await this.taxRateRepository.find({
      where: { countryCode, tenantId },
    });

    // Calculate tax liability
    let taxLiability = 0;
    const breakdown: Array<{
      category: string;
      amount: number;
      taxAmount: number;
      taxRate: number;
    }> = [];

    for (const taxRate of taxRates) {
      const rate = parseFloat(taxRate.ratePercent.toString()) / 100;
      const taxAmount = netIncome * rate;
      taxLiability += taxAmount;

      breakdown.push({
        category: taxRate.description,
        amount: netIncome,
        taxAmount,
        taxRate: rate * 100,
      });
    }

    const effectiveTaxRate = totalRevenue > 0 ? (taxLiability / totalRevenue) * 100 : 0;

    return {
      period: `${startDate} to ${endDate}`,
      totalRevenue,
      totalExpenses,
      netIncome,
      taxLiability,
      effectiveTaxRate,
      breakdown,
    };
  }

  /**
   * Get account balance for a period
   */
  private async getAccountBalance(
    accountId: string,
    startDate: string,
    endDate: string,
    balanceType: 'DEBIT' | 'CREDIT' | 'BALANCE',
  ): Promise<number> {
    const query = this.journalEntryLineRepository
      .createQueryBuilder('line')
      .leftJoin('line.journalEntry', 'entry')
      .where('line.accountId = :accountId', { accountId })
      .andWhere('entry.date >= :startDate', { startDate })
      .andWhere('entry.date <= :endDate', { endDate });

    if (balanceType === 'DEBIT') {
      query.select('SUM(line.debit)', 'balance');
    } else if (balanceType === 'CREDIT') {
      query.select('SUM(line.credit)', 'balance');
    } else {
      query.select('SUM(line.debit - line.credit)', 'balance');
    }

    const result = await query.getRawOne();
    return parseFloat(result.balance) || 0;
  }

  /**
   * Check if account is zakatable
   */
  private isZakatableAccount(account: ChartOfAccounts): boolean {
    // Zakatable assets include cash, receivables, inventory, etc.
    // Non-zakatable assets include fixed assets, accumulated depreciation, etc.
    const zakatableCodes = [
      '1110', // Cash and Cash Equivalents
      '1120', // Accounts Receivable
      '1130', // Inventory
    ];

    const nonZakatableCodes = [
      '1210', // Land and Buildings
      '1220', // Equipment
      '1230', // Vehicles
      '1240', // Accumulated Depreciation
    ];

    if (zakatableCodes.includes(account.code)) {
      return true;
    }

    if (nonZakatableCodes.includes(account.code)) {
      return false;
    }

    // Default: check if it's a current asset
    return account.code.startsWith('11') && account.level >= 3;
  }

  /**
   * Get VAT rates for a country
   */
  async getVATRates(countryCode: string, tenantId: string): Promise<TaxRate[]> {
    return this.taxRateRepository.find({
      where: { countryCode, tenantId },
      order: { code: 'ASC' },
    });
  }

  /**
   * Export VAT report to CSV
   */
  async exportVATReportToCSV(
    tenantId: string,
    startDate: string,
    endDate: string,
    countryCode: string = 'SA',
  ): Promise<string> {
    const report = await this.generateVATReport(tenantId, startDate, endDate, countryCode);

    const csvRows = [
      ['VAT Report', report.period],
      ['Total Sales', report.totalSales.toString()],
      ['Total Purchases', report.totalPurchases.toString()],
      ['VAT Collected', report.vatCollected.toString()],
      ['VAT Paid', report.vatPaid.toString()],
      ['VAT Payable', report.vatPayable.toString()],
      [''],
      ['Tax Code', 'Description', 'Rate (%)', 'Sales Amount', 'VAT Amount'],
    ];

    for (const item of report.breakdown) {
      csvRows.push([
        item.taxCode,
        item.description,
        item.rate.toString(),
        item.salesAmount.toString(),
        item.vatAmount.toString(),
      ]);
    }

    return csvRows.map((row) => row.join(',')).join('\n');
  }

  /**
   * Export Zakat report to CSV
   */
  async exportZakatReportToCSV(
    tenantId: string,
    reportDate: string,
    zakatRate: number = 2.5,
  ): Promise<string> {
    const report = await this.generateZakatReport(tenantId, reportDate, zakatRate);

    const csvRows = [
      ['Zakat Report', report.period],
      ['Total Assets', report.totalAssets.toString()],
      ['Total Liabilities', report.totalLiabilities.toString()],
      ['Net Worth', report.netWorth.toString()],
      ['Zakatable Assets', report.zakatableAssets.toString()],
      ['Zakat Rate (%)', report.zakatRate.toString()],
      ['Zakat Amount', report.zakatAmount.toString()],
      [''],
      ['Account Code', 'Account Name', 'Balance', 'Is Zakatable', 'Zakatable Amount'],
    ];

    for (const item of report.assetBreakdown) {
      csvRows.push([
        item.accountCode,
        item.accountName,
        item.balance.toString(),
        item.isZakatable.toString(),
        item.zakatableAmount.toString(),
      ]);
    }

    return csvRows.map((row) => row.join(',')).join('\n');
  }
}
