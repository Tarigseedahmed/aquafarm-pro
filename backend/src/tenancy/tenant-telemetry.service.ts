import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../common/logging/pino-logger.service';

export interface TenantFallbackEvent {
  route: string;
  method: string;
  public: boolean;
  strictMode: boolean;
  hadHeader: boolean;
  resolvedTenantId: string;
  message: string;
}

@Injectable()
export class TenantTelemetryService {
  constructor(private logger: PinoLoggerService) {}

  recordFallback(e: TenantFallbackEvent) {
    const payload = { event: 'tenant_fallback', ...e, ts: new Date().toISOString() };
    if (process.env.NODE_ENV === 'test') {
      // Silence noisy fallback logs in test to keep output clean
      return;
    }
    // In non-production (dev) keep as warn, in production maybe lower severity to info
    if (process.env.NODE_ENV === 'production') {
      this.logger.info(payload, 'TenantFallback');
    } else {
      this.logger.warn(payload, 'TenantFallback');
    }
  }
}
