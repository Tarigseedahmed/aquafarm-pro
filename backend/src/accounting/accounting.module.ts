import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartOfAccounts } from './entities/chart-of-accounts.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { TaxRate } from './entities/tax-rate.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { PostingEngineService } from './posting/posting-engine.service';
import { AccountingSeedService } from './accounting-seed.service';
import { FxRate } from './entities/fx-rate.entity';
import { FxRatesService } from './fx-rates.service';
import { FxRatesController } from './fx-rates.controller';
import { TaxEngineService } from './tax/tax-engine.service';
import { TaxEngineController } from './tax/tax-engine.controller';
import { AccountingSeedController } from './accounting-seed.controller';
import { ZATCATLVModule } from './zatca/zatca-tlv.module';
import { EGSConnectorModule } from './egs/egs-connector.module';
import { MultiCurrencyModule } from './multi-currency/multi-currency.module';
import { VATZakatReportsModule } from './reports/vat-zakat-reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChartOfAccounts,
      TaxProfile,
      TaxRate,
      JournalEntry,
      JournalEntryLine,
      FxRate,
    ]),
    ZATCATLVModule,
    EGSConnectorModule,
    MultiCurrencyModule,
    VATZakatReportsModule,
  ],
  controllers: [AccountingSeedController, FxRatesController, TaxEngineController],
  providers: [PostingEngineService, AccountingSeedService, FxRatesService, TaxEngineService],
  exports: [PostingEngineService, AccountingSeedService, FxRatesService, TaxEngineService],
})
export class AccountingModule {}
