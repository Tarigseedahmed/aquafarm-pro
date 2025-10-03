import { PostingEngineService } from './posting-engine.service';
import { PinoLoggerService } from '../../common/logging/pino-logger.service';
import { randomUUID } from 'crypto';
import { JournalEntryStatus } from '../entities/journal-entry.entity';
import { NotFoundException } from '@nestjs/common';

// Local lightweight model shapes (not TypeORM entities) for mocking
interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  tenantId?: string | null;
}
interface JELine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  metadata?: any;
  account?: Account;
}
interface JE {
  id: string;
  tenantId?: string | null;
  reference?: string | null;
  description?: string | null;
  status: JournalEntryStatus;
  transactionDate?: string | null;
  currency: string;
  totalDebit: number;
  totalCredit: number;
  metadata?: any;
  lines: JELine[];
}

describe('PostingEngineService (unit)', () => {
  const testTenantId = '11111111-1111-1111-1111-111111111111';
  let service: PostingEngineService;

  const accounts: Account[] = [];
  const entries: JE[] = [];
  const lines: JELine[] = [];

  const chartOfAccountsRepo: any = {
    find: jest.fn(async ({ where }: any) => {
      const { code, tenantId } = where;
      const codes: string[] = Array.isArray(code)
        ? code
        : Array.isArray(code?.in)
          ? code.in
          : [code];
      return accounts.filter(
        (a) => (!tenantId || a.tenantId === tenantId) && codes.includes(a.code),
      );
    }),
    findOne: jest.fn(async ({ where }: any) =>
      accounts.find((a) => a.code === where.code && a.tenantId === where.tenantId) || null,
    ),
  };

  const journalEntryRepo: any = {
    findOne: jest.fn(async ({ where, relations }: any) => {
      const entry = entries.find((e) => e.id === where.id) || null;
      if (entry && relations?.includes('lines')) {
        entry.lines = lines
          .filter((l) => l.journalEntryId === entry.id)
          .map((l) => ({
            ...l,
            account: accounts.find((a) => a.id === l.accountId),
          }));
      }
      return entry;
    }),
    create: (data: Partial<JE>) =>
      ({
        id: randomUUID(),
        status: JournalEntryStatus.DRAFT,
        currency: 'USD',
        totalDebit: 0,
        totalCredit: 0,
        lines: [],
        ...data,
      }) as JE,
    save: jest.fn(async (e: JE) => {
      const idx = entries.findIndex((en) => en.id === e.id);
      if (idx === -1) entries.push(e);
      else entries[idx] = e;
      return e;
    }),
    update: jest.fn(async (id: string, patch: Partial<JE>) => {
      const found = entries.find((e) => e.id === id);
      if (found) Object.assign(found, patch);
      return { affected: found ? 1 : 0 };
    }),
  };

  const journalEntryLineRepo: any = {
    create: (data: Partial<JELine>) =>
      ({ id: randomUUID(), debit: 0, credit: 0, ...data }) as JELine,
    save: jest.fn(async (arr: JELine[]) => {
      arr.forEach((l) => lines.push(l));
      return arr;
    }),
    createQueryBuilder: jest.fn(() => {
      const state: any = {
        accountId: null,
        status: JournalEntryStatus.POSTED,
        asOfDate: null,
      };
      const qb: any = {
        leftJoin: () => qb,
        where: (_c: string, p: any) => {
          state.accountId = p.accountId;
          return qb;
        },
        andWhere: (c: string, p: any) => {
          if (c.includes('entry.status')) state.status = p.status;
          if (c.includes('transactionDate')) state.asOfDate = p.asOfDate;
          return qb;
        },
        select: () => qb,
        addSelect: () => qb,
        getRawOne: async () => {
          const candidateLines = lines.filter(
            (l) =>
              l.accountId === state.accountId &&
              !!entries.find(
                (e) =>
                  e.id === l.journalEntryId &&
                  e.status === state.status &&
                  (!state.asOfDate || (e.transactionDate || '') <= state.asOfDate),
              ),
          );
          const debitTotal = candidateLines.reduce((s, l) => s + l.debit, 0);
          const creditTotal = candidateLines.reduce((s, l) => s + l.credit, 0);
          return { debitTotal, creditTotal };
        },
      };
      return qb;
    }),
  };

  const dataSource: any = {
    transaction: async (fn: any) => {
      const manager = {
        create: (Cls: any, data: any) => {
          if (Cls.name.includes('JournalEntryLine')) return journalEntryLineRepo.create(data);
          if (Cls.name.includes('JournalEntry')) return journalEntryRepo.create(data);
          return { ...data };
        },
        save: async (obj: any) => {
          if (Array.isArray(obj)) return journalEntryLineRepo.save(obj);
          return journalEntryRepo.save(obj);
        },
      };
      return fn(manager);
    },
  };

  const logger: PinoLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any;

  beforeEach(() => {
    accounts.length = 0;
    entries.length = 0;
    lines.length = 0;
    jest.clearAllMocks();
    accounts.push(
      {
        id: randomUUID(),
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        tenantId: testTenantId,
      },
      {
        id: randomUUID(),
        code: '4000',
        name: 'Sales',
        type: 'REVENUE',
        tenantId: testTenantId,
      },
    );
    service = new PostingEngineService(
      journalEntryRepo,
      journalEntryLineRepo,
      chartOfAccountsRepo,
      dataSource,
      logger,
    );
  });

  it('posts a balanced journal entry', async () => {
    const result = await service.post({
      tenantId: testTenantId,
      reference: 'INV-1',
      lines: [
        { accountCode: '1000', debit: 100, credit: 0, description: 'Cash receipt' },
        { accountCode: '4000', debit: 0, credit: 100, description: 'Sales revenue' },
      ],
    });
    expect(result.id).toBeDefined();
    expect(result.totalDebit).toBe(100);
    expect(result.totalCredit).toBe(100);
    expect(result.status).toBe(JournalEntryStatus.POSTED);
  });

  it('reverses a posted entry and marks original as REVERSED with metadata', async () => {
    const posted = await service.post({
      tenantId: testTenantId,
      reference: 'INV-2',
      lines: [
        { accountCode: '1000', debit: 50, credit: 0 },
        { accountCode: '4000', debit: 0, credit: 50 },
      ],
    });

  const reversal = await service.reverse(posted.id, 'Customer refund');
    expect(reversal.reference).toBe(`REV-${posted.reference}`);
    expect(reversal.totalDebit).toBe(50);
    expect(reversal.totalCredit).toBe(50);

    const original = await journalEntryRepo.findOne({
      where: { id: posted.id },
      relations: ['lines', 'lines.account'],
    });
    expect(original?.status).toBe(JournalEntryStatus.REVERSED);
    expect(original?.metadata?.reversal?.reversedBy).toBe(reversal.id);
    expect(original?.metadata?.reversal?.reason).toBe('Customer refund');
  });

  it('computes account balance (aggregates posted lines)', async () => {
    await service.post({
      tenantId: testTenantId,
      reference: 'INV-3',
      lines: [
        { accountCode: '1000', debit: 200, credit: 0 },
        { accountCode: '4000', debit: 0, credit: 200 },
      ],
    });
    const cashBalance = await service.getAccountBalance('1000', testTenantId);
    const salesBalance = await service.getAccountBalance('4000', testTenantId);
    expect(cashBalance.debitTotal).toBe(200);
    expect(cashBalance.balance).toBe(200); // asset normal debit
    expect(salesBalance.creditTotal).toBe(200);
    expect(salesBalance.balance).toBe(200); // revenue normal credit
  });

  it('rejects unbalanced draft', async () => {
    await expect(
      service.post({
        tenantId: testTenantId,
        reference: 'BAD-1',
        lines: [
          { accountCode: '1000', debit: 100, credit: 0 },
          { accountCode: '4000', debit: 0, credit: 90 },
        ],
      }),
    ).rejects.toThrow(/Debits and credits must balance/);
  });

  it('rejects draft with unknown account code', async () => {
    await expect(
      service.post({
        tenantId: testTenantId,
        reference: 'BAD-2',
        lines: [
          { accountCode: '9999', debit: 50, credit: 0 },
          { accountCode: '1000', debit: 0, credit: 50 },
        ],
      }),
    ).rejects.toThrow(/Account codes not found/);
  });

  it('fails reversing a non-posted entry', async () => {
    // Create a draft entry manually (status DRAFT) with one line
    const acct = accounts.find((a) => a.code === '1000')!;
    const entryId = randomUUID();
    entries.push({
      id: entryId,
      tenantId: testTenantId,
      reference: 'DR-1',
      description: 'Draft entry',
      status: JournalEntryStatus.DRAFT,
      transactionDate: '2025-01-10',
      currency: 'USD',
      totalDebit: 0,
      totalCredit: 0,
      metadata: {},
      lines: [],
    });
    lines.push({
      id: randomUUID(),
      journalEntryId: entryId,
      accountId: acct.id,
      debit: 0,
      credit: 0,
      description: 'No-op',
      metadata: {},
      account: acct,
    });

    await expect(service.reverse(entryId, 'Should fail')).rejects.toThrow(NotFoundException);
    const original = entries.find((e) => e.id === entryId)!;
    expect(original.status).toBe(JournalEntryStatus.DRAFT);
  });

  it('getAccountBalance respects asOfDate filtering', async () => {
    await service.post({
      tenantId: testTenantId,
      reference: 'T1',
      transactionDate: '2025-01-05',
      lines: [
        { accountCode: '1000', debit: 300, credit: 0 },
        { accountCode: '4000', debit: 0, credit: 300 },
      ],
    });
    await service.post({
      tenantId: testTenantId,
      reference: 'T2',
      transactionDate: '2025-02-10',
      lines: [
        { accountCode: '1000', debit: 150, credit: 0 },
        { accountCode: '4000', debit: 0, credit: 150 },
      ],
    });

    const balanceMid = await service.getAccountBalance('1000', testTenantId, '2025-01-31');
    expect(balanceMid.debitTotal).toBe(300); // Only first posting counted

    const balanceLater = await service.getAccountBalance('1000', testTenantId, '2025-12-31');
    expect(balanceLater.debitTotal).toBe(450); // Both postings counted
  });
});
