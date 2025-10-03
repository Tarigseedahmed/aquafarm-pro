import { Controller, Post, Body, Get } from '@nestjs/common';
import { InputSanitizationService, SanitizationOptions, ValidationRule } from './input-sanitization.service';

@Controller('example')
export class ExampleController {
  constructor(private readonly sanitizationService: InputSanitizationService) {}

  @Post('sanitize')
  async sanitizeInput(@Body() body: any) {
    // Basic sanitization with default options
    const result = this.sanitizationService.sanitizeInput(body);
    
    return {
      message: 'Input sanitized successfully',
      result,
    };
  }

  @Post('sanitize-custom')
  async sanitizeWithCustomOptions(@Body() body: any) {
    const options: SanitizationOptions = {
      stripHtml: true,
      escapeHtml: false,
      maxLength: 1000,
      allowedTags: ['b', 'i', 'em', 'strong'],
      forbiddenTags: ['script', 'iframe'],
    };

    const result = this.sanitizationService.sanitizeInput(body, options);
    
    return {
      message: 'Input sanitized with custom options',
      result,
    };
  }

  @Post('validate')
  async validateInput(@Body() body: any) {
    const rules: Record<string, ValidationRule> = {
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      email: {
        type: 'email',
        required: true,
      },
      age: {
        type: 'number',
        required: true,
        min: 18,
        max: 100,
      },
      website: {
        type: 'url',
        required: false,
      },
      phone: {
        type: 'phone',
        required: false,
      },
    };

    const result = this.sanitizationService.validateInput(body, rules);
    
    return {
      message: result.isValid ? 'Validation passed' : 'Validation failed',
      result,
    };
  }

  @Get('stats')
  async getSanitizationStats() {
    const stats = this.sanitizationService.getSanitizationStats();
    
    return {
      message: 'Sanitization service statistics',
      stats,
    };
  }

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.sanitizationService.healthCheck();
    
    return {
      message: isHealthy ? 'Service is healthy' : 'Service is unhealthy',
      healthy: isHealthy,
    };
  }
}




