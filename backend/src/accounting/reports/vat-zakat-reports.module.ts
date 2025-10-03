import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VATZakatReportsService } from './vat-zakat-reports.service';
import { VATZakatReportsController } from './vat-zakat-reports.controller';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';
import { TaxRate } from '../entities/tax-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JournalEntry, JournalEntryLine, ChartOfAccounts, TaxRate])],
  providers: [VATZakatReportsService],
  controllers: [VATZakatReportsController],
  exports: [VATZakatReportsService],
})
export class VATZakatReportsModule {}
