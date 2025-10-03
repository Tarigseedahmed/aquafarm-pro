import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export interface SecurityHeadersConfig {
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions: {
    enabled: boolean;
    value: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  };
  contentTypeOptions: boolean;
  referrerPolicy: string;
  permissionsPolicy: {
    enabled: boolean;
    features: Record<string, string[]>;
  };
  crossOriginEmbedderPolicy: boolean;
  crossOriginOpenerPolicy: string;
  crossOriginResourcePolicy: string;
  xssProtection: boolean;
  strictTransportSecurity: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
}

@Injectable()
export class SecurityHeadersService {
  private readonly logger = new Logger(SecurityHeadersService.name);
  private readonly defaultConfig: SecurityHeadersConfig;

  constructor(private configService: ConfigService) {
    this.defaultConfig = this.getDefaultSecurityHeadersConfig();
  }

  /**
   * Apply comprehensive security headers to response
   */
  applySecurityHeaders(response: Response, customConfig?: Partial<SecurityHeadersConfig>): void {
    const config = { ...this.defaultConfig, ...customConfig };

    try {
      // Content Security Policy
      if (config.contentSecurityPolicy.enabled) {
        this.applyContentSecurityPolicy(response, config.contentSecurityPolicy);
      }

      // HTTP Strict Transport Security
      if (config.hsts.enabled) {
        this.applyHSTS(response, config.hsts);
      }

      // X-Frame-Options
      if (config.frameOptions.enabled) {
        this.applyFrameOptions(response, config.frameOptions);
      }

      // X-Content-Type-Options
      if (config.contentTypeOptions) {
        response.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // Referrer Policy
      this.applyReferrerPolicy(response, config.referrerPolicy);

      // Permissions Policy
      if (config.permissionsPolicy.enabled) {
        this.applyPermissionsPolicy(response, config.permissionsPolicy);
      }

      // Cross-Origin Policies
      this.applyCrossOriginPolicies(response, config);

      // XSS Protection
      if (config.xssProtection) {
        response.setHeader('X-XSS-Protection', '1; mode=block');
      }

      // Additional security headers
      this.applyAdditionalSecurityHeaders(response);

      this.logger.debug('Security headers applied successfully');
    } catch (error) {
      this.logger.error('Failed to apply security headers:', error);
    }
  }

  /**
   * Apply Content Security Policy
   */
  private applyContentSecurityPolicy(
    response: Response,
    config: SecurityHeadersConfig['contentSecurityPolicy'],
  ): void {
    const directives: string[] = [];

    for (const [directive, values] of Object.entries(config.directives)) {
      if (values.length > 0) {
        directives.push(`${directive} ${values.join(' ')}`);
      }
    }

    const cspValue = directives.join('; ');
    response.setHeader('Content-Security-Policy', cspValue);

    // Also set report-only version for testing
    response.setHeader('Content-Security-Policy-Report-Only', cspValue);
  }

  /**
   * Apply HTTP Strict Transport Security
   */
  private applyHSTS(response: Response, config: SecurityHeadersConfig['hsts']): void {
    let hstsValue = `max-age=${config.maxAge}`;

    if (config.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }

    if (config.preload) {
      hstsValue += '; preload';
    }

    response.setHeader('Strict-Transport-Security', hstsValue);
  }

  /**
   * Apply X-Frame-Options
   */
  private applyFrameOptions(
    response: Response,
    config: SecurityHeadersConfig['frameOptions'],
  ): void {
    response.setHeader('X-Frame-Options', config.value);
  }

  /**
   * Apply Referrer Policy
   */
  private applyReferrerPolicy(response: Response, policy: string): void {
    response.setHeader('Referrer-Policy', policy);
  }

  /**
   * Apply Permissions Policy
   */
  private applyPermissionsPolicy(
    response: Response,
    config: SecurityHeadersConfig['permissionsPolicy'],
  ): void {
    const directives: string[] = [];

    for (const [feature, allowlist] of Object.entries(config.features)) {
      if (allowlist.length > 0) {
        directives.push(`${feature}=(${allowlist.join(' ')})`);
      } else {
        directives.push(`${feature}=()`);
      }
    }

    const permissionsValue = directives.join(', ');
    response.setHeader('Permissions-Policy', permissionsValue);
  }

  /**
   * Apply Cross-Origin Policies
   */
  private applyCrossOriginPolicies(response: Response, config: SecurityHeadersConfig): void {
    if (config.crossOriginEmbedderPolicy) {
      response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    response.setHeader('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
    response.setHeader('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
  }

  /**
   * Apply additional security headers
   */
  private applyAdditionalSecurityHeaders(response: Response): void {
    // Server header
    response.setHeader('Server', 'AquaFarm-Pro/1.0');

    // X-DNS-Prefetch-Control
    response.setHeader('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options
    response.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Clear-Site-Data (for logout endpoints)
    if (response.req.url?.includes('/logout')) {
      response.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    }

    // Feature Policy (legacy)
    response.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");

    // Expect-CT (deprecated but still useful)
    response.setHeader('Expect-CT', 'max-age=86400, enforce');

    // Public Key Pins (deprecated but still useful)
    const hpkpPins = this.configService.get<string>('HPKP_PINS');
    if (hpkpPins) {
      response.setHeader('Public-Key-Pins', hpkpPins);
    }
  }

  /**
   * Get default security headers configuration
   */
  private getDefaultSecurityHeadersConfig(): SecurityHeadersConfig {
    return {
      contentSecurityPolicy: {
        enabled: this.configService.get<boolean>('CSP_ENABLED', true),
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
          ],
          'img-src': [
            "'self'",
            'data:',
            'https:',
            'blob:',
          ],
          'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
            'data:',
          ],
          'connect-src': [
            "'self'",
            'https://api.aquafarm.cloud',
            'wss://api.aquafarm.cloud',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
          ],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'manifest-src': ["'self'"],
          'worker-src': [
            "'self'",
            'blob:',
          ],
        },
      },
      hsts: {
        enabled: this.configService.get<boolean>('HSTS_ENABLED', true),
        maxAge: this.configService.get<number>('HSTS_MAX_AGE', 31536000), // 1 year
        includeSubDomains: this.configService.get<boolean>('HSTS_INCLUDE_SUBDOMAINS', true),
        preload: this.configService.get<boolean>('HSTS_PRELOAD', true),
      },
      frameOptions: {
        enabled: true,
        value: this.configService.get<'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'>('FRAME_OPTIONS', 'DENY'),
      },
      contentTypeOptions: true,
      referrerPolicy: this.configService.get<string>('REFERRER_POLICY', 'strict-origin-when-cross-origin'),
      permissionsPolicy: {
        enabled: true,
        features: {
          'geolocation': [],
          'microphone': [],
          'camera': [],
          'payment': [],
          'usb': [],
          'magnetometer': [],
          'gyroscope': [],
          'speaker': [],
          'vibrate': [],
          'fullscreen': ["'self'"],
          'sync-xhr': ["'self'"],
          'picture-in-picture': [],
          'accelerometer': [],
          'ambient-light-sensor': [],
          'autoplay': [],
          'battery': [],
          'clipboard-read': [],
          'clipboard-write': [],
          'display-capture': [],
          'document-domain': [],
          'encrypted-media': [],
          'execution-while-not-rendered': [],
          'execution-while-out-of-viewport': [],
          'focus-without-user-activation': [],
          'gamepad': [],
          'layout-animations': [],
          'legacy-image-formats': [],
          'midi': [],
          'notifications': [],
          'oversized-images': [],
          'push': [],
          'screen-wake-lock': [],
          'unoptimized-images': [],
          'unsized-media': [],
          'vertical-scroll': [],
          'web-share': [],
          'xr-spatial-tracking': [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      xssProtection: true,
      strictTransportSecurity: {
        enabled: this.configService.get<boolean>('HSTS_ENABLED', true),
        maxAge: this.configService.get<number>('HSTS_MAX_AGE', 31536000),
        includeSubDomains: this.configService.get<boolean>('HSTS_INCLUDE_SUBDOMAINS', true),
        preload: this.configService.get<boolean>('HSTS_PRELOAD', true),
      },
    };
  }

  /**
   * Validate security headers configuration
   */
  validateSecurityHeadersConfig(config: SecurityHeadersConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate CSP directives
    if (config.contentSecurityPolicy.enabled) {
      const requiredDirectives = ['default-src', 'script-src', 'style-src'];
      for (const directive of requiredDirectives) {
        if (!config.contentSecurityPolicy.directives[directive]) {
          errors.push(`Missing required CSP directive: ${directive}`);
        }
      }
    }

    // Validate HSTS configuration
    if (config.hsts.enabled && config.hsts.maxAge < 300) {
      errors.push('HSTS max-age should be at least 300 seconds');
    }

    // Validate frame options
    if (config.frameOptions.enabled && !['DENY', 'SAMEORIGIN', 'ALLOW-FROM'].includes(config.frameOptions.value)) {
      errors.push('Invalid frame options value');
    }

    // Validate referrer policy
    const validReferrerPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ];

    if (!validReferrerPolicies.includes(config.referrerPolicy)) {
      errors.push('Invalid referrer policy');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get security headers status
   */
  getSecurityHeadersStatus(): {
    enabled: boolean;
    config: SecurityHeadersConfig;
    validation: {
      isValid: boolean;
      errors: string[];
    };
  } {
    const config = this.defaultConfig;
    const validation = this.validateSecurityHeadersConfig(config);

    return {
      enabled: true,
      config,
      validation,
    };
  }

  /**
   * Generate security headers report
   */
  generateSecurityHeadersReport(): {
    timestamp: Date;
    status: 'pass' | 'warn' | 'fail';
    score: number;
    details: {
      totalHeaders: number;
      enabledHeaders: number;
      disabledHeaders: number;
      warnings: string[];
      recommendations: string[];
    };
  } {
    const config = this.defaultConfig;
    const validation = this.validateSecurityHeadersConfig(config);

    let score = 100;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Calculate score based on enabled headers
    if (!config.contentSecurityPolicy.enabled) {
      score -= 20;
      warnings.push('Content Security Policy is disabled');
      recommendations.push('Enable Content Security Policy');
    }

    if (!config.hsts.enabled) {
      score -= 15;
      warnings.push('HTTP Strict Transport Security is disabled');
      recommendations.push('Enable HSTS for HTTPS sites');
    }

    if (!config.frameOptions.enabled) {
      score -= 10;
      warnings.push('X-Frame-Options is disabled');
      recommendations.push('Enable X-Frame-Options to prevent clickjacking');
    }

    if (!config.contentTypeOptions) {
      score -= 10;
      warnings.push('X-Content-Type-Options is disabled');
      recommendations.push('Enable X-Content-Type-Options');
    }

    if (!config.xssProtection) {
      score -= 10;
      warnings.push('X-XSS-Protection is disabled');
      recommendations.push('Enable X-XSS-Protection');
    }

    if (!config.permissionsPolicy.enabled) {
      score -= 10;
      warnings.push('Permissions Policy is disabled');
      recommendations.push('Enable Permissions Policy');
    }

    if (!config.crossOriginEmbedderPolicy) {
      score -= 5;
      warnings.push('Cross-Origin-Embedder-Policy is disabled');
      recommendations.push('Enable Cross-Origin-Embedder-Policy');
    }

    // Add validation errors
    if (!validation.isValid) {
      score -= validation.errors.length * 5;
      warnings.push(...validation.errors);
    }

    const totalHeaders = 8;
    const enabledHeaders = [
      config.contentSecurityPolicy.enabled,
      config.hsts.enabled,
      config.frameOptions.enabled,
      config.contentTypeOptions,
      config.permissionsPolicy.enabled,
      config.crossOriginEmbedderPolicy,
      config.xssProtection,
      true, // Referrer Policy is always enabled
    ].filter(Boolean).length;

    const status = score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail';

    return {
      timestamp: new Date(),
      status,
      score: Math.max(0, score),
      details: {
        totalHeaders,
        enabledHeaders,
        disabledHeaders: totalHeaders - enabledHeaders,
        warnings,
        recommendations,
      },
    };
  }
}
