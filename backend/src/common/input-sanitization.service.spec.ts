import { Test, TestingModule } from '@nestjs/testing';
import { InputSanitizationService } from './input-sanitization.service';
import { PinoLoggerService } from './logging/pino-logger.service';

describe('InputSanitizationService', () => {
  let service: InputSanitizationService;
  let pinoLogger: PinoLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InputSanitizationService,
        {
          provide: PinoLoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InputSanitizationService>(InputSanitizationService);
    pinoLogger = module.get<PinoLoggerService>(PinoLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML content', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = service.sanitizeInput(input);

      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('Hello World');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should handle null and undefined values', () => {
      expect(service.sanitizeInput(null).sanitized).toBeNull();
      expect(service.sanitizeInput(undefined).sanitized).toBeUndefined();
    });

    it('should sanitize objects recursively', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        age: 25,
        email: 'john@example.com',
      };

      const result = service.sanitizeInput(input);

      expect(result.sanitized.name).not.toContain('<script>');
      expect(result.sanitized.name).toContain('John');
      expect(result.sanitized.age).toBe(25);
      expect(result.sanitized.email).toBe('john@example.com');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>alert("xss")</script>', 'normal text'];
      const result = service.sanitizeInput(input);

      expect(result.sanitized[0]).not.toContain('<script>');
      expect(result.sanitized[1]).toBe('normal text');
    });

    it('should respect maxLength option', () => {
      const input = 'This is a very long string that exceeds the maximum length';
      const result = service.sanitizeInput(input, { maxLength: 10 });

      expect(result.sanitized.length).toBeLessThanOrEqual(10);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('validateInput', () => {
    it('should validate email addresses', () => {
      const rules = {
        email: { type: 'email' as const, required: true },
      };

      const validResult = service.validateInput({ email: 'test@example.com' }, rules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = service.validateInput({ email: 'invalid-email' }, rules);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('email must be a valid email address');
    });

    it('should validate URLs', () => {
      const rules = {
        url: { type: 'url' as const, required: true },
      };

      const validResult = service.validateInput({ url: 'https://example.com' }, rules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = service.validateInput({ url: 'not-a-url' }, rules);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate phone numbers', () => {
      const rules = {
        phone: { type: 'phone' as const, required: true },
      };

      const validResult = service.validateInput({ phone: '+12345678901' }, rules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = service.validateInput({ phone: 'invalid-phone' }, rules);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate required fields', () => {
      const rules = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: false },
      };

      const validResult = service.validateInput({ name: 'John', age: 25 }, rules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = service.validateInput({ age: 25 }, rules);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('name is required');
    });

    it('should validate string length constraints', () => {
      const rules = {
        name: { 
          type: 'string' as const, 
          required: true, 
          minLength: 3, 
          maxLength: 10 
        },
      };

      const validResult = service.validateInput({ name: 'John' }, rules);
      expect(validResult.isValid).toBe(true);

      const tooShortResult = service.validateInput({ name: 'Jo' }, rules);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('name must be at least 3 characters long');

      const tooLongResult = service.validateInput({ name: 'VeryLongName' }, rules);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors).toContain('name must be no more than 10 characters long');
    });

    it('should validate number constraints', () => {
      const rules = {
        age: { 
          type: 'number' as const, 
          required: true, 
          min: 18, 
          max: 65 
        },
      };

      const validResult = service.validateInput({ age: 25 }, rules);
      expect(validResult.isValid).toBe(true);

      const tooYoungResult = service.validateInput({ age: 16 }, rules);
      expect(tooYoungResult.isValid).toBe(false);
      expect(tooYoungResult.errors).toContain('age must be at least 18');

      const tooOldResult = service.validateInput({ age: 70 }, rules);
      expect(tooOldResult.isValid).toBe(false);
      expect(tooOldResult.errors).toContain('age must be no more than 65');
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      const result = await service.healthCheck();
      expect(result).toBe(true);
    });
  });

  describe('getSanitizationStats', () => {
    it('should return sanitization statistics', () => {
      const stats = service.getSanitizationStats();
      
      expect(stats.enabled).toBe(true);
      expect(stats.defaultOptions).toBeDefined();
      expect(stats.supportedTypes).toContain('string');
      expect(stats.supportedTypes).toContain('email');
      expect(stats.supportedTypes).toContain('url');
    });
  });
});
