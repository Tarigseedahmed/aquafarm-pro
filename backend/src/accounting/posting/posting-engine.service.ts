import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLoggerService } from '../../common/logging/pino-logger.service';
import { ErrorCode } from '../../common/errors/error-codes.enum';
import { JournalEntry, JournalEntryStatus } from '../entities/journal-entry.entity';
import { JournalEntryLine } from '../entities/journal-entry-line.entity';
import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';

export interface PostingLineDraft {
  accountCode: string;
  debit: number; // positive decimal
  credit: number; // positive decimal
  description?: string;
  metadata?: Record<string, any>;
}

export interface PostingDraft {
  tenantId?: string | null;
  reference?: string;
  description?: string;
  transactionDate?: string;
  currency?: string;
  lines: PostingLineDraft[];
  metadata?: Record<string, any>;
}

export interface PostingResult {
  id: string;
  reference: string;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}

@Injectable()
export class PostingEngineService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalEntryRepo: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLineRepo: Repository<JournalEntryLine>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepo: Repository<ChartOfAccounts>,
    private dataSource: DataSource,
    private readonly logger: PinoLoggerService,
  ) {}

  async validateDraft(draft: PostingDraft): Promise<void> {
    if (!draft.lines || draft.lines.length < 2) {
      throw new NotFoundException({
        message: 'At least two lines required (double-entry)',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    const totalDebit = draft.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = draft.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new NotFoundException({
        message: 'Debits and credits must balance',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    // Validate all account codes exist
    const accountCodes = draft.lines.map((line) => line.accountCode);
    const accounts = await this.chartOfAccountsRepo.find({
      where: { code: accountCodes as any, tenantId: draft.tenantId },
    });

    if (accounts.length !== accountCodes.length) {
      const foundCodes = accounts.map((acc) => acc.code);
      const missingCodes = accountCodes.filter((code) => !foundCodes.includes(code));
      throw new NotFoundException({
        message: `Account codes not found: ${missingCodes.join(', ')}`,
        code: ErrorCode.VALIDATION_ERROR,
      });
    }
  }

  async post(draft: PostingDraft, createdById?: string): Promise<PostingResult> {
    await this.validateDraft(draft);

    return await this.dataSource.transaction(async (manager) => {
      // Create journal entry
      const journalEntry = manager.create(JournalEntry, {
        tenantId: draft.tenantId,
        reference: draft.reference,
        description: draft.description,
        transactionDate: draft.transactionDate || new Date().toISOString().split('T')[0],
        currency: draft.currency || 'USD',
        status: JournalEntryStatus.POSTED,
        totalDebit: draft.lines.reduce((sum, line) => sum + line.debit, 0),
        totalCredit: draft.lines.reduce((sum, line) => sum + line.credit, 0),
        metadata: draft.metadata,
        createdById,
      });

      const savedEntry = await manager.save(journalEntry);

      // Create journal entry lines
      // Resolve account codes -> IDs first
      const accounts = await this.chartOfAccountsRepo.find({
        where: { code: draft.lines.map((l) => l.accountCode) as any, tenantId: draft.tenantId },
      });
      const accountMap = new Map(accounts.map((a) => [a.code, a.id]));

      const lines = draft.lines.map((line) =>
        manager.create(JournalEntryLine, {
          journalEntryId: savedEntry.id,
          accountId: accountMap.get(line.accountCode),
          debit: line.debit,
          credit: line.credit,
          description: line.description,
          metadata: line.metadata,
        }),
      );

      await manager.save(lines);

      this.logger.info(
        {
          event: 'posting.completed',
          journalEntryId: savedEntry.id,
          reference: savedEntry.reference,
          totalDebit: savedEntry.totalDebit,
          totalCredit: savedEntry.totalCredit,
        },
        'Journal entry posted successfully',
      );

      return {
        id: savedEntry.id,
        reference: savedEntry.reference || '',
        status: savedEntry.status,
        totalDebit: savedEntry.totalDebit,
        totalCredit: savedEntry.totalCredit,
        lines: draft.lines.map((line) => ({
          accountCode: line.accountCode,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
      };
    });
  }

  async reverse(journalEntryId: string, reason?: string): Promise<PostingResult> {
    const originalEntry = await this.journalEntryRepo.findOne({
      where: { id: journalEntryId },
      relations: ['lines', 'lines.account'],
    });

    if (!originalEntry) {
      throw new NotFoundException({
        message: 'Journal entry not found',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    if (originalEntry.status !== JournalEntryStatus.POSTED) {
      throw new NotFoundException({
        message: 'Only posted entries can be reversed',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    // Create reversal entry
    const reversalDraft: PostingDraft = {
      tenantId: originalEntry.tenantId,
      reference: `REV-${originalEntry.reference}`,
      description: `Reversal of ${originalEntry.description || originalEntry.reference}${reason ? ` - ${reason}` : ''}`,
      transactionDate: new Date().toISOString().split('T')[0],
      currency: originalEntry.currency,
      lines: originalEntry.lines.map((line) => ({
        accountCode: line.account.code,
        debit: line.credit, // Swap debit and credit
        credit: line.debit,
        description: `Reversal: ${line.description || ''}`,
      })),
      metadata: {
        ...originalEntry.metadata,
        reversalOf: journalEntryId,
        reversalReason: reason,
      },
    };

    const reversalResult = await this.post(reversalDraft);

    // Mark original entry as reversed
    const newMetadata = {
      ...(originalEntry.metadata || {}),
      reversal: {
        reversedBy: reversalResult.id,
        reason,
      },
    };
    await this.journalEntryRepo.update(journalEntryId, {
      status: JournalEntryStatus.REVERSED,
      metadata: newMetadata as any, // cast to satisfy DeepPartial typing
    });

    return reversalResult;
  }

  async getAccountBalance(
    accountCode: string,
    tenantId?: string,
    asOfDate?: string,
  ): Promise<{
    accountCode: string;
    debitTotal: number;
    creditTotal: number;
    balance: number;
  }> {
    const account = await this.chartOfAccountsRepo.findOne({
      where: { code: accountCode, tenantId },
    });

    if (!account) {
      throw new NotFoundException({
        message: 'Account not found',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    const query = this.journalEntryLineRepo
      .createQueryBuilder('line')
      .leftJoin('line.journalEntry', 'entry')
      .where('line.accountId = :accountId', { accountId: account.id })
      .andWhere('entry.status = :status', { status: JournalEntryStatus.POSTED });

    if (asOfDate) {
      query.andWhere('entry.transactionDate <= :asOfDate', { asOfDate });
    }

    const result = await query
      .select('SUM(line.debit)', 'debitTotal')
      .addSelect('SUM(line.credit)', 'creditTotal')
      .getRawOne();

    const debitTotal = parseFloat(result.debitTotal) || 0;
    const creditTotal = parseFloat(result.creditTotal) || 0;

    // Calculate balance based on account type
    let balance = 0;
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      balance = debitTotal - creditTotal; // Normal debit balance
    } else {
      balance = creditTotal - debitTotal; // Normal credit balance
    }

    return {
      accountCode,
      debitTotal,
      creditTotal,
      balance,
    };
  }
}
