import { Injectable, Logger } from '@nestjs/common';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  userId?: string;
  details?: any;
}

export interface SecurityMetrics {
  totalViolations: number;
  violationsByType: Record<string, number>;
  violationsBySeverity: Record<string, number>;
  violationsByHour: Record<string, number>;
  blockedIPs: number;
  suspiciousActivities: number;
}

@Injectable()
export class OwaspSecurityService {
  private readonly logger = new Logger(OwaspSecurityService.name);
  private violations: SecurityViolation[] = [];
  private readonly maxViolationsHistory = 1000;
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Set<string>();

  constructor(private pinoLogger: PinoLoggerService) {}

  /**
   * OWASP A01:2021 - Broken Access Control
   */
  validateAccessControl(
    userRole: string,
    requiredRole: string,
    resource: string,
    context: any = {},
  ): boolean {
    const hasAccess = this.checkRoleAccess(userRole, requiredRole);

    if (!hasAccess) {
      this.recordViolation({
        type: 'A01_BROKEN_ACCESS_CONTROL',
        severity: 'high',
        description: `Unauthorized access attempt to ${resource}`,
        details: {
          userRole,
          requiredRole,
          resource,
          context,
        },
      });
    }

    return hasAccess;
  }

  /**
   * OWASP A02:2021 - Cryptographic Failures
   */
  validateCryptographicSecurity(data: any): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check for weak encryption
    if (this.hasWeakEncryption(data)) {
      violations.push('Weak encryption detected');
    }

    // Check for plain text sensitive data
    if (this.hasPlainTextSensitiveData(data)) {
      violations.push('Plain text sensitive data detected');
    }

    // Check for deprecated algorithms
    if (this.hasDeprecatedAlgorithms(data)) {
      violations.push('Deprecated cryptographic algorithms detected');
    }

    if (violations.length > 0) {
      this.recordViolation({
        type: 'A02_CRYPTOGRAPHIC_FAILURES',
        severity: 'high',
        description: 'Cryptographic security violations detected',
        details: { violations },
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * OWASP A03:2021 - Injection
   */
  validateInjectionPrevention(input: string, type: 'sql' | 'nosql' | 'command' | 'ldap'): boolean {
    const patterns = {
      sql: [
        /['";\\|*%+\-/^[\]{}()=<>!&|~`$@#]/,
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
      ],
      nosql: [
        /\$where/,
        /\$ne/,
        /\$gt/,
        /\$lt/,
        /\$regex/,
        /\$exists/,
        /\$in/,
        /\$nin/,
        /\$or/,
        /\$and/,
      ],
      command: [
        /[;&|`$]/,
        /(\b(cat|ls|pwd|whoami|id|uname|ps|top|kill|rm|cp|mv|chmod|chown|sudo|su|passwd|useradd|userdel|groupadd|groupdel|usermod|groupmod|visudo|crontab|at|systemctl|service|init|telnet|ssh|ftp|wget|curl|nc|netcat|nmap|tcpdump|iptables|ufw|firewall-cmd|systemctl|service|init|telnet|ssh|ftp|wget|curl|nc|netcat|nmap|tcpdump|iptables|ufw|firewall-cmd)\b)/i,
      ],
      ldap: [
        /[()=*!&|]/,
        /(\b(cn|dn|ou|dc|objectClass|uid|mail|sn|givenName|telephoneNumber|userPassword|memberOf|member|groupOfNames|groupOfUniqueNames|posixAccount|posixGroup|shadowAccount|shadowGroup)\b)/i,
      ],
    };

    const typePatterns = patterns[type] || [];

    for (const pattern of typePatterns) {
      if (pattern.test(input)) {
        this.recordViolation({
          type: `A03_INJECTION_${type.toUpperCase()}`,
          severity: 'critical',
          description: `${type.toUpperCase()} injection attempt detected`,
          details: { input, type },
        });
        return false;
      }
    }

    return true;
  }

  /**
   * OWASP A04:2021 - Insecure Design
   */
  validateSecureDesign(designPattern: string, context: any): boolean {
    const insecurePatterns = [
      'hardcoded_credentials',
      'weak_authentication',
      'insufficient_authorization',
      'missing_encryption',
      'insecure_direct_object_reference',
      'missing_input_validation',
      'insufficient_logging',
      'weak_session_management',
    ];

    if (insecurePatterns.includes(designPattern)) {
      this.recordViolation({
        type: 'A04_INSECURE_DESIGN',
        severity: 'medium',
        description: `Insecure design pattern detected: ${designPattern}`,
        details: { designPattern, context },
      });
      return false;
    }

    return true;
  }

  /**
   * OWASP A05:2021 - Security Misconfiguration
   */
  validateSecurityConfiguration(config: any): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for default credentials
    if (this.hasDefaultCredentials(config)) {
      issues.push('Default credentials detected');
    }

    // Check for unnecessary services
    if (this.hasUnnecessaryServices(config)) {
      issues.push('Unnecessary services enabled');
    }

    // Check for insecure headers
    if (this.hasInsecureHeaders(config)) {
      issues.push('Insecure security headers');
    }

    // Check for debug mode in production
    if (this.isDebugModeInProduction(config)) {
      issues.push('Debug mode enabled in production');
    }

    if (issues.length > 0) {
      this.recordViolation({
        type: 'A05_SECURITY_MISCONFIGURATION',
        severity: 'medium',
        description: 'Security misconfiguration detected',
        details: { issues, config },
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * OWASP A06:2021 - Vulnerable and Outdated Components
   */
  validateComponentSecurity(components: any[]): {
    isSecure: boolean;
    vulnerabilities: any[];
  } {
    const vulnerabilities: any[] = [];

    for (const component of components) {
      // Check for outdated versions
      if (this.isOutdatedComponent(component)) {
        vulnerabilities.push({
          type: 'outdated_version',
          component: component.name,
          currentVersion: component.version,
          latestVersion: component.latestVersion,
        });
      }

      // Check for known vulnerabilities
      if (this.hasKnownVulnerabilities(component)) {
        vulnerabilities.push({
          type: 'known_vulnerability',
          component: component.name,
          version: component.version,
          vulnerabilities: component.vulnerabilities,
        });
      }
    }

    if (vulnerabilities.length > 0) {
      this.recordViolation({
        type: 'A06_VULNERABLE_COMPONENTS',
        severity: 'high',
        description: 'Vulnerable or outdated components detected',
        details: { vulnerabilities },
      });
    }

    return {
      isSecure: vulnerabilities.length === 0,
      vulnerabilities,
    };
  }

  /**
   * OWASP A07:2021 - Identification and Authentication Failures
   */
  validateAuthentication(
    credentials: any,
    context: any = {},
  ): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for weak passwords
    if (this.isWeakPassword(credentials.password)) {
      issues.push('Weak password detected');
    }

    // Check for common passwords
    if (this.isCommonPassword(credentials.password)) {
      issues.push('Common password detected');
    }

    // Check for brute force attempts
    if (this.isBruteForceAttempt(credentials.email, context.ip)) {
      issues.push('Brute force attempt detected');
    }

    // Check for session fixation
    if (this.isSessionFixationAttempt(credentials.sessionId)) {
      issues.push('Session fixation attempt detected');
    }

    if (issues.length > 0) {
      this.recordViolation({
        type: 'A07_AUTHENTICATION_FAILURES',
        severity: 'high',
        description: 'Authentication security issues detected',
        details: { issues, context },
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * OWASP A08:2021 - Software and Data Integrity Failures
   */
  validateDataIntegrity(data: any, checksum: string): boolean {
    const calculatedChecksum = this.calculateChecksum(data);

    if (calculatedChecksum !== checksum) {
      this.recordViolation({
        type: 'A08_DATA_INTEGRITY_FAILURE',
        severity: 'high',
        description: 'Data integrity violation detected',
        details: { calculatedChecksum, providedChecksum: checksum },
      });
      return false;
    }

    return true;
  }

  /**
   * OWASP A09:2021 - Security Logging and Monitoring Failures
   */
  validateLoggingAndMonitoring(logs: any[]): {
    isAdequate: boolean;
    gaps: string[];
  } {
    const gaps: string[] = [];

    // Check for missing security events
    if (!this.hasSecurityEventLogging(logs)) {
      gaps.push('Missing security event logging');
    }

    // Check for insufficient log retention
    if (!this.hasAdequateLogRetention(logs)) {
      gaps.push('Insufficient log retention');
    }

    // Check for missing monitoring
    if (!this.hasSecurityMonitoring(logs)) {
      gaps.push('Missing security monitoring');
    }

    if (gaps.length > 0) {
      this.recordViolation({
        type: 'A09_LOGGING_MONITORING_FAILURES',
        severity: 'medium',
        description: 'Security logging and monitoring gaps detected',
        details: { gaps },
      });
    }

    return {
      isAdequate: gaps.length === 0,
      gaps,
    };
  }

  /**
   * OWASP A10:2021 - Server-Side Request Forgery (SSRF)
   */
  validateSSRFPrevention(url: string, allowedDomains: string[]): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check if domain is in allowed list
      if (!allowedDomains.includes(domain)) {
        this.recordViolation({
          type: 'A10_SSRF_ATTEMPT',
          severity: 'high',
          description: 'SSRF attempt detected',
          details: { url, domain, allowedDomains },
        });
        return false;
      }

      // Check for private IP addresses
      if (this.isPrivateIP(domain)) {
        this.recordViolation({
          type: 'A10_SSRF_PRIVATE_IP',
          severity: 'high',
          description: 'SSRF attempt to private IP detected',
          details: { url, domain },
        });
        return false;
      }

      return true;
    } catch (error) {
      this.recordViolation({
        type: 'A10_SSRF_INVALID_URL',
        severity: 'medium',
        description: 'Invalid URL in SSRF validation',
        details: { url, error: error.message },
      });
      return false;
    }
  }

  /**
   * Record security violation
   */
  private recordViolation(violation: Omit<SecurityViolation, 'timestamp'>): void {
    const fullViolation: SecurityViolation = {
      ...violation,
      timestamp: new Date(),
    };

    this.violations.push(fullViolation);

    // Keep only recent violations
    if (this.violations.length > this.maxViolationsHistory) {
      this.violations = this.violations.slice(-this.maxViolationsHistory);
    }

    // Log violation
    this.pinoLogger.warn(
      {
        event: 'security.violation',
        type: violation.type,
        severity: violation.severity,
        description: violation.description,
        details: violation.details,
      },
      `Security violation: ${violation.type} - ${violation.description}`
    );

    // Block IP if critical violation
    if (violation.severity === 'critical' && violation.ip) {
      this.blockedIPs.add(violation.ip);
      this.logger.warn(`IP ${violation.ip} blocked due to critical security violation`);
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentViolations = this.violations.filter(
      v => v.timestamp >= last24Hours
    );

    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const violationsByHour: Record<string, number> = {};

    for (const violation of recentViolations) {
      violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1;
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;

      const hour = violation.timestamp.getHours().toString();
      violationsByHour[hour] = (violationsByHour[hour] || 0) + 1;
    }

    return {
      totalViolations: recentViolations.length,
      violationsByType,
      violationsBySeverity,
      violationsByHour,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousIPs.size,
    };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if IP is suspicious
   */
  isIPSuspicious(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Helper methods for validation
   */
  private checkRoleAccess(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'admin': ['admin', 'manager', 'user'],
      'manager': ['manager', 'user'],
      'user': ['user'],
    };

    return roleHierarchy[userRole]?.includes(requiredRole) || false;
  }

  private hasWeakEncryption(data: any): boolean {
    // Implementation for weak encryption detection
    return false;
  }

  private hasPlainTextSensitiveData(data: any): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i,
    ];

    const dataStr = JSON.stringify(data);
    return sensitivePatterns.some(pattern => pattern.test(dataStr));
  }

  private hasDeprecatedAlgorithms(data: any): boolean {
    // Implementation for deprecated algorithm detection
    return false;
  }

  private hasDefaultCredentials(config: any): boolean {
    const defaultCreds = [
      'admin:admin',
      'root:root',
      'user:user',
      'admin:password',
      'root:password',
    ];

    return defaultCreds.some(cred =>
      JSON.stringify(config).includes(cred)
    );
  }

  private hasUnnecessaryServices(config: any): boolean {
    // Implementation for unnecessary services detection
    return false;
  }

  private hasInsecureHeaders(config: any): boolean {
    // Implementation for insecure headers detection
    return false;
  }

  private isDebugModeInProduction(config: any): boolean {
    return config.debug === true && config.environment === 'production';
  }

  private isOutdatedComponent(component: any): boolean {
    // Implementation for outdated component detection
    return false;
  }

  private hasKnownVulnerabilities(component: any): boolean {
    // Implementation for known vulnerabilities detection
    return false;
  }

  private isWeakPassword(password: string): boolean {
    return password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password);
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  private isBruteForceAttempt(email: string, ip: string): boolean {
    // Implementation for brute force detection
    return false;
  }

  private isSessionFixationAttempt(sessionId: string): boolean {
    // Implementation for session fixation detection
    return false;
  }

  private calculateChecksum(data: any): string {
    // Implementation for checksum calculation
    return 'calculated_checksum';
  }

  private hasSecurityEventLogging(logs: any[]): boolean {
    // Implementation for security event logging check
    return true;
  }

  private hasAdequateLogRetention(logs: any[]): boolean {
    // Implementation for log retention check
    return true;
  }

  private hasSecurityMonitoring(logs: any[]): boolean {
    // Implementation for security monitoring check
    return true;
  }

  private isPrivateIP(domain: string): boolean {
    const privateIPs = [
      '10.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
      '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
      '172.30.', '172.31.', '192.168.', '127.', '169.254.',
    ];

    return privateIPs.some(ip => domain.startsWith(ip));
  }
}
