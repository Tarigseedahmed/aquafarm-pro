import { Module } from '@nestjs/common';
import { OwaspSecurityService } from './owasp-security.service';
import { SecurityHeadersService } from './security-headers.service';
import { SecurityHeadersInterceptor, ApiSecurityHeadersInterceptor, StaticFileSecurityHeadersInterceptor } from './security-headers.interceptor';
import { InputSanitizationService } from './input-sanitization.service';
import { InputSanitizationInterceptor, ApiInputSanitizationInterceptor, FileUploadSanitizationInterceptor } from './input-sanitization.interceptor';
import { SecurityMonitoringService } from './security-monitoring.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [
    OwaspSecurityService,
    SecurityHeadersService,
    SecurityHeadersInterceptor,
    ApiSecurityHeadersInterceptor,
    StaticFileSecurityHeadersInterceptor,
    InputSanitizationService,
    InputSanitizationInterceptor,
    ApiInputSanitizationInterceptor,
    FileUploadSanitizationInterceptor,
    SecurityMonitoringService,
  ],
  exports: [
    OwaspSecurityService,
    SecurityHeadersService,
    SecurityHeadersInterceptor,
    ApiSecurityHeadersInterceptor,
    StaticFileSecurityHeadersInterceptor,
    InputSanitizationService,
    InputSanitizationInterceptor,
    ApiInputSanitizationInterceptor,
    FileUploadSanitizationInterceptor,
    SecurityMonitoringService,
  ],
})
export class SecurityModule {}
