# Input Sanitization Service

A comprehensive input sanitization and validation service for the AquaFarm Pro backend, designed to protect against XSS attacks, injection vulnerabilities, and ensure data integrity.

## Features

- **HTML Sanitization**: Removes or escapes malicious HTML content using DOMPurify
- **Input Validation**: Comprehensive validation for emails, URLs, phone numbers, IPs, UUIDs, and more
- **Recursive Processing**: Handles nested objects and arrays
- **Configurable Options**: Customizable sanitization rules and validation constraints
- **Performance Monitoring**: Tracks processing time and violation statistics
- **Health Checks**: Built-in health monitoring for service reliability

## Installation

The service is already included in the backend dependencies:

```bash
# Dependencies are already installed
npm install validator @types/validator
```

## Usage

### Basic Import and Setup

```typescript
import { InputSanitizationService } from './common/input-sanitization.service';
import { InputSanitizationModule } from './common/input-sanitization.module';

// In your module
@Module({
  imports: [InputSanitizationModule],
  // ... other imports
})
export class YourModule {}
```

### Sanitization

#### Basic Sanitization

```typescript
constructor(private readonly sanitizationService: InputSanitizationService) {}

// Basic sanitization with default options
const result = this.sanitizationService.sanitizeInput(userInput);
console.log(result.sanitized); // Cleaned input
console.log(result.violations); // Array of detected issues
```

#### Custom Sanitization Options

```typescript
const options: SanitizationOptions = {
  stripHtml: true,           // Remove HTML tags
  escapeHtml: false,        // Don't escape HTML (since we're stripping)
  maxLength: 1000,          // Maximum string length
  allowedTags: ['b', 'i'],  // Allowed HTML tags
  forbiddenTags: ['script'], // Forbidden HTML tags
  normalizeWhitespace: true, // Clean up whitespace
  removeNullBytes: true,    // Remove null bytes
};

const result = this.sanitizationService.sanitizeInput(userInput, options);
```

### Validation

#### Basic Validation

```typescript
const rules: Record<string, ValidationRule> = {
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
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
  },
};

const result = this.sanitizationService.validateInput(userData, rules);
if (result.isValid) {
  // Use validated data
  console.log(result.validated);
} else {
  // Handle validation errors
  console.log(result.errors);
}
```

#### Advanced Validation

```typescript
const rules: Record<string, ValidationRule> = {
  website: {
    type: 'url',
    required: false,
  },
  phone: {
    type: 'phone',
    required: true,
  },
  userId: {
    type: 'uuid',
    required: true,
  },
  ipAddress: {
    type: 'ip',
    required: false,
  },
  birthDate: {
    type: 'date',
    required: true,
  },
  status: {
    type: 'string',
    required: true,
    allowedValues: ['active', 'inactive', 'pending'],
  },
  customField: {
    type: 'string',
    required: true,
    pattern: /^[A-Z]{3}\d{3}$/, // Custom regex pattern
    customValidator: (value) => {
      // Custom validation logic
      return value.startsWith('ABC');
    },
  },
};
```

## API Reference

### SanitizationOptions

```typescript
interface SanitizationOptions {
  stripHtml?: boolean;           // Remove HTML tags (default: true)
  escapeHtml?: boolean;          // Escape HTML characters (default: true)
  normalizeWhitespace?: boolean; // Clean whitespace (default: true)
  removeNullBytes?: boolean;     // Remove null bytes (default: true)
  maxLength?: number;           // Maximum string length
  allowedTags?: string[];       // Allowed HTML tags
  allowedAttributes?: Record<string, string[]>; // Allowed HTML attributes
  forbiddenTags?: string[];     // Forbidden HTML tags
  forbiddenAttributes?: string[]; // Forbidden HTML attributes
  min?: number;                 // Minimum number value
  max?: number;                 // Maximum number value
}
```

### ValidationRule

```typescript
interface ValidationRule {
  type: 'email' | 'url' | 'phone' | 'ip' | 'uuid' | 'date' | 'number' | 'string' | 'boolean' | 'array' | 'object';
  required?: boolean;           // Field is required
  minLength?: number;           // Minimum string length
  maxLength?: number;           // Maximum string length
  pattern?: RegExp;             // Custom regex pattern
  min?: number;                 // Minimum number value
  max?: number;                 // Maximum number value
  allowedValues?: any[];        // Allowed values
  customValidator?: (value: any) => boolean; // Custom validation function
}
```

### SanitizationResult

```typescript
interface SanitizationResult {
  sanitized: any;              // Sanitized input
  violations: string[];         // Array of detected violations
  originalLength: number;       // Original input length
  sanitizedLength: number;     // Sanitized input length
  processingTime: number;      // Processing time in milliseconds
}
```

## Service Methods

### `sanitizeInput(input: any, options?: SanitizationOptions): SanitizationResult`

Sanitizes input data recursively, handling strings, numbers, objects, and arrays.

### `validateInput(input: any, rules: Record<string, ValidationRule>): ValidationResult`

Validates input against defined rules and returns validation results.

### `getSanitizationStats(): SanitizationStats`

Returns service statistics and configuration information.

### `healthCheck(): Promise<boolean>`

Performs a health check to ensure the service is working correctly.

## Security Features

- **XSS Protection**: Removes or escapes malicious HTML/JavaScript
- **Injection Prevention**: Validates and sanitizes all input types
- **Length Limits**: Prevents buffer overflow attacks
- **Type Validation**: Ensures data types match expectations
- **Pattern Matching**: Supports custom regex validation
- **Null Byte Removal**: Prevents null byte injection attacks

## Performance Considerations

- **Recursive Processing**: Efficiently handles nested data structures
- **Performance Monitoring**: Tracks processing time for optimization
- **Configurable Limits**: Prevents resource exhaustion
- **Memory Efficient**: Processes data in-place when possible

## Error Handling

The service provides comprehensive error handling:

```typescript
try {
  const result = this.sanitizationService.sanitizeInput(input);
  // Handle successful sanitization
} catch (error) {
  // Handle sanitization errors
  this.logger.error('Sanitization failed', error);
}
```

## Testing

Run the test suite:

```bash
npm test -- input-sanitization.service.spec.ts
```

The test suite covers:
- HTML sanitization
- Input validation
- Edge cases (null, undefined)
- Performance testing
- Health checks

## Integration Examples

### Controller Integration

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly sanitizationService: InputSanitizationService) {}

  @Post()
  async createUser(@Body() userData: any) {
    // Sanitize input
    const sanitized = this.sanitizationService.sanitizeInput(userData);
    
    // Validate input
    const validation = this.sanitizationService.validateInput(sanitized.sanitized, {
      name: { type: 'string', required: true, minLength: 2 },
      email: { type: 'email', required: true },
    });

    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }

    // Use validated data
    return this.userService.create(validation.validated);
  }
}
```

### Middleware Integration

```typescript
@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  constructor(private readonly sanitizationService: InputSanitizationService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      const result = this.sanitizationService.sanitizeInput(req.body);
      req.body = result.sanitized;
    }
    next();
  }
}
```

## Best Practices

1. **Always sanitize user input** before processing
2. **Validate data types** and constraints
3. **Use appropriate sanitization options** for your use case
4. **Monitor violation statistics** for security insights
5. **Test edge cases** thoroughly
6. **Keep sanitization rules updated** with security best practices

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure all dependencies are installed
2. **Path resolution**: Check import paths are correct
3. **Type errors**: Verify TypeScript configuration
4. **Validation failures**: Check rule definitions

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// The service uses the PinoLoggerService for logging
// Check logs for detailed information about sanitization and validation
```

## Contributing

When contributing to the input sanitization service:

1. Add tests for new features
2. Update documentation
3. Follow security best practices
4. Consider performance implications
5. Test edge cases thoroughly




