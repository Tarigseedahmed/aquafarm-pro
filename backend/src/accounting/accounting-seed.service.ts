import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccounts, AccountType } from './entities/chart-of-accounts.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { TaxRate } from './entities/tax-rate.entity';

@Injectable()
export class AccountingSeedService {
  constructor(
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(TaxProfile)
    private taxProfileRepository: Repository<TaxProfile>,
    @InjectRepository(TaxRate)
    private taxRateRepository: Repository<TaxRate>,
  ) {}

  /**
   * Seed default chart of accounts for a tenant
   */
  async seedChartOfAccounts(tenantId: string): Promise<ChartOfAccounts[]> {
    const accounts = [
      // Assets (Level 1)
      {
        code: '1000',
        name: 'ASSETS',
        type: 'ASSET',
        level: 1,
        isSystem: true,
        description: 'All company assets',
      },

      // Current Assets (Level 2)
      {
        code: '1100',
        name: 'CURRENT ASSETS',
        type: 'ASSET',
        level: 2,
        isSystem: true,
        description: 'Assets expected to be converted to cash within one year',
      },
      {
        code: '1110',
        name: 'Cash and Cash Equivalents',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Cash, bank accounts, and short-term investments',
      },
      {
        code: '1120',
        name: 'Accounts Receivable',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Amounts owed by customers',
      },
      {
        code: '1130',
        name: 'Inventory',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Raw materials, work in progress, and finished goods',
      },
      {
        code: '1140',
        name: 'Prepaid Expenses',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Expenses paid in advance',
      },

      // Fixed Assets (Level 2)
      {
        code: '1200',
        name: 'FIXED ASSETS',
        type: 'ASSET',
        level: 2,
        isSystem: true,
        description: 'Long-term assets used in business operations',
      },
      {
        code: '1210',
        name: 'Land and Buildings',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Real estate owned by the company',
      },
      {
        code: '1220',
        name: 'Equipment',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Machinery and equipment',
      },
      {
        code: '1230',
        name: 'Vehicles',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Company vehicles',
      },
      {
        code: '1240',
        name: 'Accumulated Depreciation',
        type: 'ASSET',
        level: 3,
        isSystem: true,
        description: 'Depreciation accumulated on fixed assets',
      },

      // Liabilities (Level 1)
      {
        code: '2000',
        name: 'LIABILITIES',
        type: 'LIABILITY',
        level: 1,
        isSystem: true,
        description: 'All company liabilities',
      },

      // Current Liabilities (Level 2)
      {
        code: '2100',
        name: 'CURRENT LIABILITIES',
        type: 'LIABILITY',
        level: 2,
        isSystem: true,
        description: 'Liabilities due within one year',
      },
      {
        code: '2110',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        level: 3,
        isSystem: true,
        description: 'Amounts owed to suppliers',
      },
      {
        code: '2120',
        name: 'Accrued Expenses',
        type: 'LIABILITY',
        level: 3,
        isSystem: true,
        description: 'Expenses incurred but not yet paid',
      },
      {
        code: '2130',
        name: 'Short-term Debt',
        type: 'LIABILITY',
        level: 3,
        isSystem: true,
        description: 'Debt due within one year',
      },
      {
        code: '2140',
        name: 'Tax Payable',
        type: 'LIABILITY',
        level: 3,
        isSystem: true,
        description: 'Taxes owed to government',
      },

      // Long-term Liabilities (Level 2)
      {
        code: '2200',
        name: 'LONG-TERM LIABILITIES',
        type: 'LIABILITY',
        level: 2,
        isSystem: true,
        description: 'Liabilities due after one year',
      },
      {
        code: '2210',
        name: 'Long-term Debt',
        type: 'LIABILITY',
        level: 3,
        isSystem: true,
        description: 'Debt due after one year',
      },

      // Equity (Level 1)
      {
        code: '3000',
        name: 'EQUITY',
        type: 'EQUITY',
        level: 1,
        isSystem: true,
        description: 'Owner equity and retained earnings',
      },
      {
        code: '3100',
        name: 'Share Capital',
        type: 'EQUITY',
        level: 2,
        isSystem: true,
        description: 'Capital contributed by owners',
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'EQUITY',
        level: 2,
        isSystem: true,
        description: 'Accumulated profits retained in business',
      },

      // Revenue (Level 1)
      {
        code: '4000',
        name: 'REVENUE',
        type: 'REVENUE',
        level: 1,
        isSystem: true,
        description: 'Income from business operations',
      },
      {
        code: '4100',
        name: 'Sales Revenue',
        type: 'REVENUE',
        level: 2,
        isSystem: true,
        description: 'Revenue from sales of goods and services',
      },
      {
        code: '4110',
        name: 'Fish Sales',
        type: 'REVENUE',
        level: 3,
        isSystem: true,
        description: 'Revenue from fish sales',
      },
      {
        code: '4120',
        name: 'Feed Sales',
        type: 'REVENUE',
        level: 3,
        isSystem: true,
        description: 'Revenue from feed sales',
      },
      {
        code: '4200',
        name: 'Other Revenue',
        type: 'REVENUE',
        level: 2,
        isSystem: true,
        description: 'Other sources of income',
      },

      // Expenses (Level 1)
      {
        code: '5000',
        name: 'EXPENSES',
        type: 'EXPENSE',
        level: 1,
        isSystem: true,
        description: 'All business expenses',
      },

      // Cost of Goods Sold (Level 2)
      {
        code: '5100',
        name: 'COST OF GOODS SOLD',
        type: 'EXPENSE',
        level: 2,
        isSystem: true,
        description: 'Direct costs of producing goods',
      },
      {
        code: '5110',
        name: 'Feed Costs',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Cost of fish feed',
      },
      {
        code: '5120',
        name: 'Fingerling Costs',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Cost of fish fingerlings',
      },
      {
        code: '5130',
        name: 'Labor Costs',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Direct labor costs',
      },

      // Operating Expenses (Level 2)
      {
        code: '5200',
        name: 'OPERATING EXPENSES',
        type: 'EXPENSE',
        level: 2,
        isSystem: true,
        description: 'General operating expenses',
      },
      {
        code: '5210',
        name: 'Salaries and Wages',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Employee compensation',
      },
      {
        code: '5220',
        name: 'Utilities',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Electricity, water, gas',
      },
      {
        code: '5230',
        name: 'Maintenance',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Equipment and facility maintenance',
      },
      {
        code: '5240',
        name: 'Insurance',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Business insurance premiums',
      },
      {
        code: '5250',
        name: 'Professional Services',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Legal, accounting, consulting fees',
      },
      {
        code: '5260',
        name: 'Marketing',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Advertising and marketing expenses',
      },
      {
        code: '5270',
        name: 'Travel',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Business travel expenses',
      },
      {
        code: '5280',
        name: 'Office Supplies',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Office materials and supplies',
      },

      // Depreciation (Level 2)
      {
        code: '5300',
        name: 'DEPRECIATION',
        type: 'EXPENSE',
        level: 2,
        isSystem: true,
        description: 'Depreciation of fixed assets',
      },
      {
        code: '5310',
        name: 'Equipment Depreciation',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Depreciation of equipment',
      },
      {
        code: '5320',
        name: 'Building Depreciation',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Depreciation of buildings',
      },

      // Interest and Finance (Level 2)
      {
        code: '5400',
        name: 'INTEREST AND FINANCE',
        type: 'EXPENSE',
        level: 2,
        isSystem: true,
        description: 'Interest and financing costs',
      },
      {
        code: '5410',
        name: 'Interest Expense',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Interest on loans and debt',
      },
      {
        code: '5420',
        name: 'Bank Charges',
        type: 'EXPENSE',
        level: 3,
        isSystem: true,
        description: 'Banking fees and charges',
      },
    ];

    const createdAccounts: ChartOfAccounts[] = [];

    for (const accountData of accounts) {
      const existingAccount = await this.chartOfAccountsRepository.findOne({
        where: { code: accountData.code, tenantId },
      });

      if (!existingAccount) {
        // Cast string literal type to AccountType enum to satisfy TS
        const account = this.chartOfAccountsRepository.create({
          ...accountData,
          type: accountData.type as AccountType,
          tenantId,
          isActive: true,
        });
        const savedAccount = await this.chartOfAccountsRepository.save(account);
        createdAccounts.push(savedAccount);
      }
    }

    // Set parent relationships
    await this.setParentRelationships(tenantId);

    return createdAccounts;
  }

  /**
   * Set parent relationships for chart of accounts
   */
  private async setParentRelationships(tenantId: string): Promise<void> {
    const relationships = [
      { childCode: '1100', parentCode: '1000' },
      { childCode: '1200', parentCode: '1000' },
      { childCode: '1110', parentCode: '1100' },
      { childCode: '1120', parentCode: '1100' },
      { childCode: '1130', parentCode: '1100' },
      { childCode: '1140', parentCode: '1100' },
      { childCode: '1210', parentCode: '1200' },
      { childCode: '1220', parentCode: '1200' },
      { childCode: '1230', parentCode: '1200' },
      { childCode: '1240', parentCode: '1200' },
      { childCode: '2100', parentCode: '2000' },
      { childCode: '2200', parentCode: '2000' },
      { childCode: '2110', parentCode: '2100' },
      { childCode: '2120', parentCode: '2100' },
      { childCode: '2130', parentCode: '2100' },
      { childCode: '2140', parentCode: '2100' },
      { childCode: '2210', parentCode: '2200' },
      { childCode: '3100', parentCode: '3000' },
      { childCode: '3200', parentCode: '3000' },
      { childCode: '4100', parentCode: '4000' },
      { childCode: '4200', parentCode: '4000' },
      { childCode: '4110', parentCode: '4100' },
      { childCode: '4120', parentCode: '4100' },
      { childCode: '5100', parentCode: '5000' },
      { childCode: '5200', parentCode: '5000' },
      { childCode: '5300', parentCode: '5000' },
      { childCode: '5400', parentCode: '5000' },
      { childCode: '5110', parentCode: '5100' },
      { childCode: '5120', parentCode: '5100' },
      { childCode: '5130', parentCode: '5100' },
      { childCode: '5210', parentCode: '5200' },
      { childCode: '5220', parentCode: '5200' },
      { childCode: '5230', parentCode: '5200' },
      { childCode: '5240', parentCode: '5200' },
      { childCode: '5250', parentCode: '5200' },
      { childCode: '5260', parentCode: '5200' },
      { childCode: '5270', parentCode: '5200' },
      { childCode: '5280', parentCode: '5200' },
      { childCode: '5310', parentCode: '5300' },
      { childCode: '5320', parentCode: '5300' },
      { childCode: '5410', parentCode: '5400' },
      { childCode: '5420', parentCode: '5400' },
    ];

    for (const rel of relationships) {
      const child = await this.chartOfAccountsRepository.findOne({
        where: { code: rel.childCode, tenantId },
      });
      const parent = await this.chartOfAccountsRepository.findOne({
        where: { code: rel.parentCode, tenantId },
      });

      if (child && parent) {
        child.parentId = parent.id;
        await this.chartOfAccountsRepository.save(child);
      }
    }
  }

  /**
   * Seed default tax profiles for a tenant
   */
  async seedTaxProfiles(tenantId: string): Promise<TaxProfile[]> {
    const profiles = [
      { countryCode: 'SA', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'AE', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'EG', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'KW', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'QA', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'BH', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'OM', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'JO', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'LB', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
      { countryCode: 'IQ', taxIdNumber: '123456789012345', regime: 'STANDARD', isActive: true },
    ];

    const createdProfiles: TaxProfile[] = [];

    for (const profileData of profiles) {
      const existingProfile = await this.taxProfileRepository.findOne({
        where: { countryCode: profileData.countryCode, tenantId },
      });

      if (!existingProfile) {
        const profile = this.taxProfileRepository.create({
          ...profileData,
          tenantId,
        });
        const savedProfile = await this.taxProfileRepository.save(profile);
        createdProfiles.push(savedProfile);
      }
    }

    return createdProfiles;
  }

  /**
   * Seed default tax rates for a tenant
   */
  async seedTaxRates(tenantId: string): Promise<TaxRate[]> {
    const rates = [
      // Saudi Arabia
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 15.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'SA',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'SA',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'SA',
      },

      // UAE
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 5.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'AE',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'AE',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2018-01-01',
        isCompound: false,
        countryCode: 'AE',
      },

      // Egypt
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 14.0,
        validFrom: '2017-07-01',
        isCompound: false,
        countryCode: 'EG',
      },
      {
        code: 'VAT_REDUCED',
        description: 'Reduced VAT Rate',
        ratePercent: 5.0,
        validFrom: '2017-07-01',
        isCompound: false,
        countryCode: 'EG',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2017-07-01',
        isCompound: false,
        countryCode: 'EG',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2017-07-01',
        isCompound: false,
        countryCode: 'EG',
      },

      // Kuwait
      {
        code: 'CORPORATE_TAX',
        description: 'Corporate Income Tax',
        ratePercent: 15.0,
        validFrom: '2008-01-01',
        isCompound: false,
        countryCode: 'KW',
      },
      {
        code: 'WITHHOLDING_TAX',
        description: 'Withholding Tax',
        ratePercent: 5.0,
        validFrom: '2008-01-01',
        isCompound: false,
        countryCode: 'KW',
      },

      // Qatar
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 5.0,
        validFrom: '2020-01-01',
        isCompound: false,
        countryCode: 'QA',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2020-01-01',
        isCompound: false,
        countryCode: 'QA',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2020-01-01',
        isCompound: false,
        countryCode: 'QA',
      },

      // Bahrain
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 10.0,
        validFrom: '2019-01-01',
        isCompound: false,
        countryCode: 'BH',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2019-01-01',
        isCompound: false,
        countryCode: 'BH',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2019-01-01',
        isCompound: false,
        countryCode: 'BH',
      },

      // Oman
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 5.0,
        validFrom: '2021-04-01',
        isCompound: false,
        countryCode: 'OM',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2021-04-01',
        isCompound: false,
        countryCode: 'OM',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2021-04-01',
        isCompound: false,
        countryCode: 'OM',
      },

      // Jordan
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 16.0,
        validFrom: '2016-01-01',
        isCompound: false,
        countryCode: 'JO',
      },
      {
        code: 'VAT_REDUCED',
        description: 'Reduced VAT Rate',
        ratePercent: 4.0,
        validFrom: '2016-01-01',
        isCompound: false,
        countryCode: 'JO',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2016-01-01',
        isCompound: false,
        countryCode: 'JO',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2016-01-01',
        isCompound: false,
        countryCode: 'JO',
      },

      // Lebanon
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 11.0,
        validFrom: '2002-01-01',
        isCompound: false,
        countryCode: 'LB',
      },
      {
        code: 'VAT_REDUCED',
        description: 'Reduced VAT Rate',
        ratePercent: 4.0,
        validFrom: '2002-01-01',
        isCompound: false,
        countryCode: 'LB',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2002-01-01',
        isCompound: false,
        countryCode: 'LB',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2002-01-01',
        isCompound: false,
        countryCode: 'LB',
      },

      // Iraq
      {
        code: 'VAT_STANDARD',
        description: 'Standard VAT Rate',
        ratePercent: 15.0,
        validFrom: '2023-01-01',
        isCompound: false,
        countryCode: 'IQ',
      },
      {
        code: 'VAT_ZERO',
        description: 'Zero-rated VAT',
        ratePercent: 0.0,
        validFrom: '2023-01-01',
        isCompound: false,
        countryCode: 'IQ',
      },
      {
        code: 'VAT_EXEMPT',
        description: 'VAT Exempt',
        ratePercent: 0.0,
        validFrom: '2023-01-01',
        isCompound: false,
        countryCode: 'IQ',
      },
    ];

    const createdRates: TaxRate[] = [];

    for (const rateData of rates) {
      const existingRate = await this.taxRateRepository.findOne({
        where: {
          code: rateData.code,
          countryCode: rateData.countryCode,
          tenantId,
        },
      });

      if (!existingRate) {
        const rate = this.taxRateRepository.create({
          ...rateData,
          ratePercent: rateData.ratePercent.toString(), // ensure string per entity definition
          tenantId,
        });
        const savedRate = await this.taxRateRepository.save(rate);
        createdRates.push(savedRate);
      }
    }

    return createdRates;
  }

  /**
   * Seed all accounting data for a tenant
   */
  async seedAll(tenantId: string): Promise<{
    accounts: ChartOfAccounts[];
    profiles: TaxProfile[];
    rates: TaxRate[];
  }> {
    const accounts = await this.seedChartOfAccounts(tenantId);
    const profiles = await this.seedTaxProfiles(tenantId);
    const rates = await this.seedTaxRates(tenantId);

    return {
      accounts,
      profiles,
      rates,
    };
  }

  /**
   * Check if tenant has accounting data seeded
   */
  async hasSeededData(tenantId: string): Promise<boolean> {
    const accountCount = await this.chartOfAccountsRepository.count({ where: { tenantId } });
    const profileCount = await this.taxProfileRepository.count({ where: { tenantId } });
    const rateCount = await this.taxRateRepository.count({ where: { tenantId } });

    return accountCount > 0 || profileCount > 0 || rateCount > 0;
  }
}
