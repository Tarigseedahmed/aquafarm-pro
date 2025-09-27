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
    this.logger.warn(
      { event: 'tenant_fallback', ...e, ts: new Date().toISOString() },
      'TenantFallback',
    );
  }
}
