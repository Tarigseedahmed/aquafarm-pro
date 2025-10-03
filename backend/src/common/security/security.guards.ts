import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { SecurityMonitoringService } from './security-monitoring.service';
import { OwaspSecurityService } from './owasp-security.service';

// Extend Request type to include session
interface RequestWithSession extends Request {
  session?: {
    csrfToken?: string;
    [key: string]: any;
  };
}

@Injectable()
export class SecurityMonitoringGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
    private owaspSecurity: OwaspSecurityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Check if IP is blocked
    if (this.securityMonitoring.isIPBlocked(request.ip)) {
      this.securityMonitoring.recordSecurityEvent({
        type: 'AUTHENTICATION_FAILURE',
        severity: 'high',
        source: {
          ip: request.ip,
          userAgent: request.headers['user-agent'] as string,
        },
        details: {
          description: 'Blocked IP attempted to access protected resource',
          endpoint: request.url,
          method: request.method,
        },
        metadata: {
          requestId: request.headers['x-request-id'] as string,
        },
      });

      throw new ForbiddenException('Access denied');
    }

    // Check if IP is suspicious
    if (this.securityMonitoring.isIPSuspicious(request.ip)) {
      this.securityMonitoring.recordSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        source: {
          ip: request.ip,
          userAgent: request.headers['user-agent'] as string,
        },
        details: {
          description: 'Suspicious IP accessed protected resource',
          endpoint: request.url,
          method: request.method,
        },
        metadata: {
          requestId: request.headers['x-request-id'] as string,
        },
      });
    }

    return true;
  }
}

@Injectable()
export class InputValidationGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
    private owaspSecurity: OwaspSecurityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Validate query parameters
    if (request.query && typeof request.query === 'object') {
      const queryStr = JSON.stringify(request.query);

      if (!this.owaspSecurity.validateInjectionPrevention(queryStr, 'sql')) {
        this.securityMonitoring.recordSecurityEvent({
          type: 'SQL_INJECTION_ATTEMPT',
          severity: 'critical',
          source: {
            ip: request.ip,
            userAgent: request.headers['user-agent'] as string,
          },
          details: {
            description: 'SQL injection attempt detected in query parameters',
            endpoint: request.url,
            method: request.method,
            payload: queryStr,
          },
          metadata: {
            requestId: request.headers['x-request-id'] as string,
          },
        });

        throw new ForbiddenException('Invalid input detected');
      }
    }

    return true;
  }
}

@Injectable()
export class CSRFProtectionGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();

    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Check for CSRF token
    const csrfToken = (request.headers['x-csrf-token'] as string) || request.body?.csrfToken;
    const sessionToken = request.session?.csrfToken;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      this.securityMonitoring.recordSecurityEvent({
        type: 'CSRF_ATTEMPT',
        severity: 'high',
        source: {
          ip: request.ip,
          userAgent: request.headers['user-agent'] as string,
        },
        details: {
          description: 'CSRF attack attempt detected',
          endpoint: request.url,
          method: request.method,
        },
        metadata: {
          requestId: request.headers['x-request-id'] as string,
        },
      });

      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}

@Injectable()
export class FileUploadSecurityGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();

    // Check if this is a file upload request
    if (!request.file && !request.files) {
      return true;
    }

    const files = Array.isArray(request.files)
      ? request.files
      : request.files
        ? Object.values(request.files)
        : request.file
          ? [request.file]
          : [];

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (file) {
        // Check file size
        if (file.size > maxFileSize) {
          this.securityMonitoring.recordSecurityEvent({
            type: 'FILE_UPLOAD_VIOLATION',
            severity: 'medium',
            source: {
              ip: request.ip,
              userAgent: request.headers['user-agent'] as string,
            },
            details: {
              description: 'File size exceeds limit',
              endpoint: request.url,
              method: request.method,
              payload: { filename: file.originalname, size: file.size },
            },
            metadata: {
              requestId: request.headers['x-request-id'] as string,
            },
          });

          throw new ForbiddenException('File size exceeds limit');
        }

        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          this.securityMonitoring.recordSecurityEvent({
            type: 'FILE_UPLOAD_VIOLATION',
            severity: 'high',
            source: {
              ip: request.ip,
              userAgent: request.headers['user-agent'] as string,
            },
            details: {
              description: 'Invalid file type uploaded',
              endpoint: request.url,
              method: request.method,
              payload: { filename: file.originalname, mimetype: file.mimetype },
            },
            metadata: {
              requestId: request.headers['x-request-id'] as string,
            },
          });

          throw new ForbiddenException('Invalid file type');
        }

        // Check for malicious file extensions
        const maliciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

        if (maliciousExtensions.includes(fileExtension)) {
          this.securityMonitoring.recordSecurityEvent({
            type: 'FILE_UPLOAD_VIOLATION',
            severity: 'critical',
            source: {
              ip: request.ip,
              userAgent: request.headers['user-agent'] as string,
            },
            details: {
              description: 'Malicious file extension detected',
              endpoint: request.url,
              method: request.method,
              payload: { filename: file.originalname, extension: fileExtension },
            },
            metadata: {
              requestId: request.headers['x-request-id'] as string,
            },
          });

          throw new ForbiddenException('Malicious file type detected');
        }
      }
    }

    return true;
  }
}

@Injectable()
export class RateLimitSecurityGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Check if request is rate limited
    const rateLimitInfo = response.getHeader('X-RateLimit-Remaining');

    if (rateLimitInfo === '0') {
      this.securityMonitoring.recordSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        source: {
          ip: request.ip,
          userAgent: request.headers['user-agent'] as string,
        },
        details: {
          description: 'Rate limit exceeded',
          endpoint: request.url,
          method: request.method,
        },
        metadata: {
          requestId: request.headers['x-request-id'] as string,
        },
      });
    }

    return true;
  }
}

@Injectable()
export class SecurityHeadersGuard implements CanActivate {
  constructor(
    private securityMonitoring: SecurityMonitoringService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check for security header violations
    const userAgent = request.headers['user-agent'] as string;

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'zap',
      'burp',
      'w3af',
      'acunetix',
      'nessus',
      'openvas',
      'metasploit',
      'havij',
      'pangolin',
      'sqlninja',
      'bsqlbf',
      'sqlsus',
    ];

    if (suspiciousUserAgents.some(ua => userAgent?.toLowerCase().includes(ua))) {
      this.securityMonitoring.recordSecurityEvent({
        type: 'VULNERABILITY_SCAN',
        severity: 'high',
        source: {
          ip: request.ip,
          userAgent,
        },
        details: {
          description: 'Vulnerability scanner detected',
          endpoint: request.url,
          method: request.method,
        },
        metadata: {
          requestId: request.headers['x-request-id'] as string,
        },
      });
    }

    return true;
  }
}
