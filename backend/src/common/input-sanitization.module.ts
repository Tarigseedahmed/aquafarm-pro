import { Module } from '@nestjs/common';
import { InputSanitizationService } from './input-sanitization.service';
import { PinoLoggerService } from './logging/pino-logger.service';

@Module({
  providers: [InputSanitizationService, PinoLoggerService],
  exports: [InputSanitizationService],
})
export class InputSanitizationModule {}




