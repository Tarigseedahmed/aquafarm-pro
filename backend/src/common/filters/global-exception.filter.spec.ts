import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorCode } from '../errors/error-codes.enum';
import { PinoLoggerService } from '../logging/pino-logger.service';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

// Simple stub logger (avoid real pino I/O in unit test)
class StubLogger extends PinoLoggerService {
  logs: any[] = [];
  error(obj: any) {
    this.logs.push(obj);
  }
  info() {}
  warn() {}
  log() {}
}

function createMockHost(req: any, res: any): ArgumentsHost {
  // Minimal mock of ArgumentsHost for HTTP context
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
      getNext: () => undefined,
    }),
    // Unused interface methods for this test
    getArgByIndex: () => undefined,
    getArgs: () => [],
    getType: () => 'http',
  } as any;
}

describe('GlobalExceptionFilter', () => {
  let logger: StubLogger;
  let filter: GlobalExceptionFilter;
  let statusCode: number | undefined;
  let jsonBody: any | undefined;

  beforeEach(() => {
    logger = new StubLogger();
    filter = new GlobalExceptionFilter(logger as any);
    statusCode = undefined;
    jsonBody = undefined;
  });

  function runCatch(exception: any, requestOverrides: any = {}) {
    const req = { originalUrl: '/test', ...requestOverrides };
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        jsonBody = body;
        return body;
      },
    };
    const host = createMockHost(req, res);
    filter.catch(exception, host);
  }

  it('preserves explicit provided code inside HttpException response body', () => {
    class CustomHttpException extends HttpException {
      constructor() {
        super(
          { message: 'Pond not found', code: ErrorCode.POND_NOT_FOUND, error: 'NotFoundException' },
          HttpStatus.NOT_FOUND,
        );
      }
    }
    runCatch(new CustomHttpException());
    expect(statusCode).toBe(404);
    expect(jsonBody.code).toBe(ErrorCode.POND_NOT_FOUND);
    expect(jsonBody.message).toContain('Pond not found');
  });

  it('maps 404 without explicit code to NOT_FOUND', () => {
    class NoCodeNotFound extends HttpException {
      constructor() {
        super('Missing', HttpStatus.NOT_FOUND);
      }
    }
    runCatch(new NoCodeNotFound());
    expect(jsonBody.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('maps 400 to VALIDATION_ERROR when no explicit code', () => {
    class BadReq extends HttpException {
      constructor() {
        super('Bad input', HttpStatus.BAD_REQUEST);
      }
    }
    runCatch(new BadReq());
    expect(jsonBody.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('defaults internal error when plain Error thrown', () => {
    runCatch(new Error('Boom'));
    expect(statusCode).toBe(500);
    expect(jsonBody.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(jsonBody.message).toContain('Boom');
  });
});
