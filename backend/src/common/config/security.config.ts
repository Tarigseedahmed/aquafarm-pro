import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    issuer: string;
    audience: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    hsts: boolean;
  };
}

@Injectable()
export class SecurityConfigService {
  constructor(private configService: ConfigService) {}

  getSecurityConfig(): SecurityConfig {
    this.validateRequiredEnvVars();

    return {
      jwt: {
        secret: this.configService.get<string>('JWT_SECRET')!,
        refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET')!,
        accessTokenExpiresIn:
          this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
          this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
        refreshTokenExpiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
          this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'aquafarm-pro'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'aquafarm-users'),
      },
      bcrypt: {
        saltRounds: parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12')),
      },
      cors: {
        origins: this.getCorsOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Tenant-Id',
          'X-Correlation-Id',
          'X-Requested-With',
          'Accept',
          'Origin',
        ],
      },
      helmet: {
        contentSecurityPolicy: this.configService.get<string>('NODE_ENV') === 'production',
        hsts: this.configService.get<string>('NODE_ENV') === 'production',
      },
    };
  }

  private validateRequiredEnvVars(): void {
    const requiredVars = ['JWT_SECRET'];
    const missing = requiredVars.filter(varName => !this.configService.get(varName));
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required security environment variables: ${missing.join(', ')}\n` +
        'Please set these variables before starting the application.'
      );
    }

    // Validate JWT secret strength
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security purposes.\n' +
        'Generate a strong secret with: openssl rand -base64 48'
      );
    }
  }

  private getCorsOrigins(): string[] {
    const rawOrigins =
      this.configService.get<string>('CORS_ORIGINS') ||
      this.configService.get<string>('CORS_ORIGIN');
    
    if (!rawOrigins) {
      // In production, default to empty array (no origins allowed)
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error('CORS_ORIGINS must be set in production environment');
      }
      // In development, allow localhost
      return ['http://localhost:3000', 'http://localhost:3001'];
    }

    return rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
