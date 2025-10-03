import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
