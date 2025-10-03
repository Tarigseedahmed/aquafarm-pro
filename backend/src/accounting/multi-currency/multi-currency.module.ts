import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiCurrencyService } from './multi-currency.service';
import { MultiCurrencyController } from './multi-currency.controller';
import { FxRate } from '../entities/fx-rate.entity';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FxRate, JournalEntry, JournalEntryLine, ChartOfAccounts])],
  providers: [MultiCurrencyService],
  controllers: [MultiCurrencyController],
  exports: [MultiCurrencyService],
})
export class MultiCurrencyModule {}
