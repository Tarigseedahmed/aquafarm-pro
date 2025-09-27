import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../../common/logging/pino-logger.service';
import { ErrorCode } from '../../common/errors/error-codes.enum';

export interface PostingLineDraft {
  accountCode: string;
  debit: number; // positive decimal
  credit: number; // positive decimal
  meta?: Record<string, any>;
}

export interface PostingDraft {
  tenantId?: string | null;
  reference?: string;
  lines: PostingLineDraft[];
  currency?: string;
}

@Injectable()
export class PostingService {
  constructor(private readonly logger: PinoLoggerService) {}

  validateDraft(draft: PostingDraft) {
    if (!draft.lines || draft.lines.length < 2) {
      throw {
        status: 400,
        message: 'At least two lines required (double-entry)',
        error: 'ValidationError',
        code: ErrorCode.VALIDATION_ERROR,
      };
    }
    const totalDebit = draft.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = draft.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw {
        status: 400,
        message: 'Debits and credits must balance',
        error: 'ValidationError',
        code: ErrorCode.VALIDATION_ERROR,
      };
    }
  }

  async post(draft: PostingDraft) {
    this.validateDraft(draft);
    this.logger.info({ event: 'posting.accepted', draft }, 'Posting draft accepted (no-op)');
    return { id: 'POSTING-NOOP', ...draft };
  }
}
