import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  formattedErrors: string[];
}

@Injectable()
export class ValidationService {
  constructor(private logger: PinoLoggerService) {}

  /**
   * Validate DTO object
   */
  async validateDto<T extends object>(
    dtoClass: new () => T,
    plainObject: any,
    context?: string,
  ): Promise<ValidationResult> {
    try {
      // Transform plain object to class instance
      const dto = plainToClass(dtoClass, plainObject);

      // Validate the object
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      // Format errors for user-friendly messages
      const formattedErrors = this.formatValidationErrors(errors);

      // Log validation results
      this.logValidationResult(dtoClass.name, errors.length === 0, errors.length, context);

      return {
        isValid: errors.length === 0,
        errors,
        formattedErrors,
      };
    } catch (error) {
      this.logger.error(
        {
          event: 'validation.error',
          error: error.message,
          dtoClass: dtoClass.name,
          context,
        },
        'Validation service error',
      );

      return {
        isValid: false,
        errors: [],
        formattedErrors: ['Validation service error occurred'],
      };
    }
  }

  /**
   * Validate multiple DTOs
   */
  async validateMultipleDtos<T extends object>(
    validations: Array<{
      dtoClass: new () => T;
      data: any;
      context?: string;
    }>,
  ): Promise<ValidationResult[]> {
    const results = await Promise.all(
      validations.map(({ dtoClass, data, context }) =>
        this.validateDto(dtoClass, data, context),
      ),
    );

    return results;
  }

  /**
   * Validate query parameters
   */
  async validateQueryParams<T extends object>(
    dtoClass: new () => T,
    query: any,
  ): Promise<ValidationResult> {
    return this.validateDto(dtoClass, query, 'query');
  }

  /**
   * Validate request body
   */
  async validateRequestBody<T extends object>(
    dtoClass: new () => T,
    body: any,
  ): Promise<ValidationResult> {
    return this.validateDto(dtoClass, body, 'body');
  }

  /**
   * Format validation errors into user-friendly messages
   */
  private formatValidationErrors(errors: ValidationError[]): string[] {
    const formattedErrors: string[] = [];

    errors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          formattedErrors.push(`${error.property}: ${message}`);
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatValidationErrors(error.children);
        childErrors.forEach((childError) => {
          formattedErrors.push(`${error.property}.${childError}`);
        });
      }
    });

    return formattedErrors;
  }

  /**
   * Log validation results
   */
  private logValidationResult(
    dtoClass: string,
    isValid: boolean,
    errorCount: number,
    context?: string,
  ): void {
    const logData = {
      event: 'validation.result',
      dtoClass,
      isValid,
      errorCount,
      context,
    };

    if (isValid) {
      this.logger.debug(logData, 'Validation successful');
    } else {
      this.logger.warn(logData, 'Validation failed');
    }
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      Object.keys(data).forEach((key) => {
        sanitized[key] = this.sanitizeInput(data[key]);
      });
      return sanitized;
    }

    return data;
  }

  /**
   * Validate and sanitize input
   */
  async validateAndSanitize<T extends object>(
    dtoClass: new () => T,
    data: any,
    context?: string,
  ): Promise<ValidationResult & { sanitizedData?: T }> {
    const sanitizedData = this.sanitizeInput(data);
    const validationResult = await this.validateDto(dtoClass, sanitizedData, context);

    return {
      ...validationResult,
      sanitizedData: validationResult.isValid ? sanitizedData : undefined,
    };
  }

  /**
   * Check if value is safe for SQL queries (additional protection)
   */
  isSqlSafe(value: any): boolean {
    if (typeof value !== 'string') return true;

    // Check for common SQL injection patterns
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(UNION\s+SELECT)/i,
      /(OR\s+1\s*=\s*1)/i,
      /(AND\s+1\s*=\s*1)/i,
      /(;\s*DROP)/i,
      /(;\s*DELETE)/i,
      /(;\s*INSERT)/i,
      /(;\s*UPDATE)/i,
      /(--|\/\*|\*\/)/, // SQL comments
      /(xp_|sp_)/i, // SQL Server procedures
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: any): ValidationResult {
    const errors: ValidationError[] = [];
    const formattedErrors: string[] = [];

    if (!file) {
      formattedErrors.push('No file provided');
      return { isValid: false, errors, formattedErrors };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      formattedErrors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      formattedErrors.push('File type not allowed');
    }

    // Check filename
    if (file.originalname.length > 255) {
      formattedErrors.push('Filename too long');
    }

    // Check for dangerous filename patterns
    const dangerousPatterns = [/\.\./, /[<>:"|?*]/];
    if (dangerousPatterns.some((pattern) => pattern.test(file.originalname))) {
      formattedErrors.push('Filename contains invalid characters');
    }

    return {
      isValid: formattedErrors.length === 0,
      errors,
      formattedErrors,
    };
  }
}
