import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger, LoggerOptions } from 'pino';
import { getCorrelationId } from '../correlation/correlation-context';

@Injectable()
export class PinoLoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    const options: LoggerOptions = {
      level: process.env.LOG_LEVEL || 'info',
      base: { service: process.env.SERVICE_NAME || 'aquafarm-backend' },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    // Enable pretty transport only in interactive development (not production, not test, not CI)
    let transport: any = undefined;
    const env = process.env.NODE_ENV;
    const isDevPretty = !['production', 'test'].includes(env || '') && !process.env.CI;
    if (isDevPretty) {
      try {
        // Check if pino-pretty is installed; if not, skip silently.
        require.resolve('pino-pretty');
        transport = { target: 'pino-pretty', options: { colorize: true, singleLine: true } };
      } catch {
        // no-op fallback
      }
    }
    this.logger = pino({ ...options, transport });
  }

  private withContext(bindings?: Record<string, any>) {
    const cid = getCorrelationId();
    return this.logger.child({ correlationId: cid, ...bindings });
  }

  log(message: any, context?: string) {
    this.withContext({ context }).info(message);
  }
  info(message: any, context?: string) {
    this.log(message, context);
  }
  warn(message: any, context?: string) {
    this.withContext({ context }).warn(message);
  }
  error(message: any, trace?: string, context?: string) {
    this.withContext({ context, trace }).error(message);
  }
  debug?(message: any, context?: string) {
    this.withContext({ context }).debug(message);
  }
  verbose?(message: any, context?: string) {
    this.withContext({ context }).trace(message);
  }
  trace?(message: any, context?: string) {
    this.withContext({ context }).trace(message);
  }
  fatal?(message: any, context?: string) {
    this.withContext({ context }).fatal(message);
  }
}
