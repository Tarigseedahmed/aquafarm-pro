import { Injectable, Logger } from '@nestjs/common';
import { PinoLoggerService } from './logging/pino-logger.service';
import * as DOMPurify from 'isomorphic-dompurify';
import * as validator from 'validator';

export interface SanitizationOptions {
  stripHtml?: boolean;
  escapeHtml?: boolean;
  normalizeWhitespace?: boolean;
  removeNullBytes?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  forbiddenTags?: string[];
  forbiddenAttributes?: string[];
  min?: number;
  max?: number;
}

export interface SanitizationResult {
  sanitized: any;
  violations: string[];
  originalLength: number;
  sanitizedLength: number;
  processingTime: number;
}

export interface ValidationRule {
  type:
    | 'email'
    | 'url'
    | 'phone'
    | 'ip'
    | 'uuid'
    | 'date'
    | 'number'
    | 'string'
    | 'boolean'
    | 'array'
    | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean;
}

@Injectable()
export class InputSanitizationService {
  private readonly logger = new Logger(InputSanitizationService.name);

  private readonly defaultOptions: SanitizationOptions = {
    stripHtml: true,
    escapeHtml: true,
    normalizeWhitespace: true,
    removeNullBytes: true,
    maxLength: 10000,
    allowedTags: [],
    allowedAttributes: {},
    forbiddenTags: ['script', 'iframe', 'object', 'embed', 'link', 'meta'],
    forbiddenAttributes: [
      'onclick',
      'onload',
      'onerror',
      'onmouseover',
      'onfocus',
      'onblur',
    ],
  };

  constructor(private readonly pinoLogger: PinoLoggerService) {}

  /**
   * Sanitize input data recursively
   */
  sanitizeInput(
    input: any,
    options: SanitizationOptions = {},
  ): SanitizationResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    const violations: string[] = [];

    try {
      const sanitized = this.sanitizeValue(input, opts, violations);
      const processingTime = Date.now() - startTime;

      const result: SanitizationResult = {
        sanitized,
        violations,
        originalLength: input ? JSON.stringify(input).length : 0,
        sanitizedLength: sanitized ? JSON.stringify(sanitized).length : 0,
        processingTime,
      };

      if (violations.length > 0) {
        this.logger.warn(
          `Input sanitization violations detected: ${violations.length}`,
          {
            event: 'input.sanitization.violations',
            violations,
            processingTime,
          },
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Input sanitization failed', error as any);
      throw error;
    }
  }

  /**
   * Sanitize a single value
   */
  private sanitizeValue(
    value: any,
    options: SanitizationOptions,
    violations: string[],
  ): any {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string')
      return this.sanitizeString(value, options, violations);

    if (typeof value === 'number')
      return this.sanitizeNumber(value, options, violations);

    if (typeof value === 'boolean') return value;

    if (Array.isArray(value))
      return this.sanitizeArray(value, options, violations);

    if (typeof value === 'object')
      return this.sanitizeObject(value, options, violations);

    return value;
  }

  /**
   * Sanitize string value
   */
  private sanitizeString(
    value: string,
    options: SanitizationOptions,
    violations: string[],
  ): string {
    let sanitized = value;

    // Remove null bytes
    if (options.removeNullBytes) {
      sanitized = sanitized.replace(/\0/g, '');
    }

    // Normalize whitespace
    if (options.normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
    }

    // Check length
    if (options.maxLength && sanitized.length > options.maxLength) {
      violations.push(
        `String length exceeds maximum: ${sanitized.length} > ${options.maxLength}`,
      );
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Strip HTML using DOMPurify
    if (options.stripHtml) {
      const originalLength = sanitized.length;
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: options.allowedTags ?? [],
        ALLOWED_ATTR: Object.values(options.allowedAttributes ?? {}).flat(),
        FORBID_TAGS: options.forbiddenTags ?? [],
        FORBID_ATTR: options.forbiddenAttributes ?? [],
        KEEP_CONTENT: true,
      });

      if (sanitized.length !== originalLength) {
        violations.push('HTML content stripped from string');
      }
    }

    // Escape HTML
    if (options.escapeHtml && !options.stripHtml) {
      sanitized = this.escapeHtml(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize number value
   */
  private sanitizeNumber(
    value: number,
    options: SanitizationOptions,
    violations: string[],
  ): number {
    if (isNaN(value)) {
      violations.push('Invalid number: NaN');
      return 0;
    }

    if (!isFinite(value)) {
      violations.push('Invalid number: Infinity');
      return 0;
    }

    if (options.min !== undefined && value < options.min) {
      violations.push(`Number below minimum: ${value} < ${options.min}`);
      return options.min;
    }

    if (options.max !== undefined && value > options.max) {
      violations.push(`Number above maximum: ${value} > ${options.max}`);
      return options.max;
    }

    return value;
  }

  /**
   * Sanitize array value
   */
  private sanitizeArray(
    value: any[],
    options: SanitizationOptions,
    violations: string[],
  ): any[] {
    return value.map((item) =>
      this.sanitizeValue(item, options, violations),
    );
  }

  /**
   * Sanitize object value
   */
  private sanitizeObject(
    value: Record<string, any>,
    options: SanitizationOptions,
    violations: string[],
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, val] of Object.entries(value)) {
      const sanitizedKey = this.sanitizeString(key, options, violations);
      sanitized[sanitizedKey] = this.sanitizeValue(val, options, violations);
    }

    return sanitized;
  }

  /**
   * Validate input against rules
   */
  validateInput(
    input: any,
    rules: Record<string, ValidationRule>,
  ): {
    isValid: boolean;
    errors: string[];
    validated: any;
  } {
    const errors: string[] = [];
    const validated: any = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];
      const validation = this.validateField(value, field, rule);

      if (!validation.isValid) {
        errors.push(...validation.errors);
      } else {
        validated[field] = validation.value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validated,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(
    value: any,
    fieldName: string,
    rule: ValidationRule,
  ): {
    isValid: boolean;
    errors: string[];
    value: any;
  } {
    const errors: string[] = [];

    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors, value };
    }

    if (!rule.required && (value === null || value === undefined)) {
      return { isValid: true, errors, value };
    }

    const typeValidation = this.validateType(value, fieldName, rule.type);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
      return { isValid: false, errors, value: typeValidation.value };
    }

    value = typeValidation.value;

    if (['string', 'email', 'url', 'phone'].includes(rule.type)) {
      const stringValidation = this.validateString(value, fieldName, rule);
      if (!stringValidation.isValid) {
        errors.push(...stringValidation.errors);
        return { isValid: false, errors, value: stringValidation.value };
      }
      value = stringValidation.value;
    }

    if (rule.type === 'number') {
      const numberValidation = this.validateNumber(value, fieldName, rule);
      if (!numberValidation.isValid) {
        errors.push(...numberValidation.errors);
        return { isValid: false, errors, value: numberValidation.value };
      }
      value = numberValidation.value;
    }

    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${fieldName} does not match required pattern`);
    }

    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(`${fieldName} is not in allowed values: ${rule.allowedValues.join(', ')}`);
    }

    if (rule.customValidator && !rule.customValidator(value)) {
      errors.push(`${fieldName} failed custom validation`);
    }

    return { isValid: errors.length === 0, errors, value };
  }

  /**
   * Validate type
   */
  private validateType(
    value: any,
    fieldName: string,
    type: ValidationRule['type'],
  ): {
    isValid: boolean;
    errors: string[];
    value: any;
  } {
    const errors: string[] = [];

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
          return { isValid: false, errors, value };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a valid number`);
          return { isValid: false, errors, value: 0 };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
          return { isValid: false, errors, value: false };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
          return { isValid: false, errors, value: [] };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`${fieldName} must be an object`);
          return { isValid: false, errors, value: {} };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          errors.push(`${fieldName} must be a valid email address`);
          return { isValid: false, errors, value };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          errors.push(`${fieldName} must be a valid URL`);
          return { isValid: false, errors, value };
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !validator.isMobilePhone(value)) {
          errors.push(`${fieldName} must be a valid phone number`);
          return { isValid: false, errors, value };
        }
        break;

      case 'ip':
        if (typeof value !== 'string' || !validator.isIP(value)) {
          errors.push(`${fieldName} must be a valid IP address`);
          return { isValid: false, errors, value };
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          errors.push(`${fieldName} must be a valid UUID`);
          return { isValid: false, errors, value };
        }
        break;

      case 'date':
        if (typeof value !== 'string' || !validator.isISO8601(value)) {
          errors.push(`${fieldName} must be a valid ISO 8601 date`);
          return { isValid: false, errors, value };
        }
        break;
    }

    return { isValid: true, errors, value };
  }

  /**
   * Validate string
   */
  private validateString(
    value: string,
    fieldName: string,
    rule: ValidationRule,
  ): {
    isValid: boolean;
    errors: string[];
    value: string;
  } {
    const errors: string[] = [];

    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
      value = value.substring(0, rule.maxLength);
    }

    return { isValid: errors.length === 0, errors, value };
  }

  /**
   * Validate number
   */
  private validateNumber(
    value: number,
    fieldName: string,
    rule: ValidationRule,
  ): {
    isValid: boolean;
    errors: string[];
    value: number;
  } {
    const errors: string[] = [];

    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`);
    }

    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} must be no more than ${rule.max}`);
    }

    return { isValid: errors.length === 0, errors, value };
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (s) => map[s]);
  }

  /**
   * Get sanitization statistics
   */
  getSanitizationStats(): {
    enabled: boolean;
    defaultOptions: SanitizationOptions;
    supportedTypes: string[];
  } {
    return {
      enabled: true,
      defaultOptions: this.defaultOptions,
      supportedTypes: [
        'string',
        'number',
        'boolean',
        'array',
        'object',
        'email',
        'url',
        'phone',
        'ip',
        'uuid',
        'date',
      ],
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testInput = '<script>alert("test")</script>';
      const result = this.sanitizeInput(testInput);
      return result.sanitized !== testInput;
    } catch (error) {
      this.logger.error('Input sanitization health check failed', error as any);
      return false;
    }
  }
}
