import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SecurityConfigService } from '../common/config/security.config';
import { PinoLoggerService } from '../common/logging/pino-logger.service';
import { RedisService } from '../redis/redis.service';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private securityConfig: SecurityConfigService,
    private logger: PinoLoggerService,
    private redisService: RedisService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(user: User): Promise<TokenPair> {
    const config = this.securityConfig.getSecurityConfig();

    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Generate access token (short-lived)
    const accessToken = await this.jwtService.signAsync(
      { ...basePayload, type: 'access' },
      {
        expiresIn: config.jwt.accessTokenExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      },
    );

    // Generate refresh token (long-lived)
    const refreshToken = await this.jwtService.signAsync(
      { ...basePayload, type: 'refresh' },
      {
        expiresIn: config.jwt.refreshTokenExpiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        secret: config.jwt.refreshSecret,
      },
    );

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(config.jwt.accessTokenExpiresIn);

    this.logger.info(
      {
        event: 'token.pair.generated',
        userId: user.id,
        expiresIn,
      },
      'Token pair generated successfully',
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const config = this.securityConfig.getSecurityConfig();

      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        secret: config.jwt.refreshSecret,
      }) as TokenPayload;

      // Validate token type
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type for refresh');
      }

      // SECURITY FIX: Check if token is blacklisted
      const blacklistKey = `token:blacklist:${payload.sub}:${payload.iat}`;
      const isBlacklisted = await this.redisService.get(blacklistKey);
      if (isBlacklisted) {
        this.logger.warn({
          event: 'token.refresh.blocked',
          userId: payload.sub,
          reason: 'Token in blacklist'
        }, 'Blocked blacklisted token refresh attempt');
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user from database
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new token pair
      return this.generateTokenPair(user);
    } catch (error) {
      this.logger.warn(
        {
          event: 'token.refresh.failed',
          error: error.message,
        },
        'Token refresh failed',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const config = this.securityConfig.getSecurityConfig();

      const payload = await this.jwtService.verifyAsync(token, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as TokenPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      this.logger.warn(
        {
          event: 'token.verify.failed',
          error: error.message,
        },
        'Token verification failed',
      );
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Revoke refresh token - Store in Redis blacklist
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken) as TokenPayload;

      // SECURITY FIX: Store token in Redis blacklist
      const blacklistKey = `token:blacklist:${payload.sub}:${payload.iat}`;

      // Calculate TTL based on token expiration
      const now = Math.floor(Date.now() / 1000);
      const ttl = payload.exp ? Math.max(payload.exp - now, 0) : 7 * 24 * 60 * 60; // Default 7 days

      if (ttl > 0) {
        await this.redisService.setex(blacklistKey, ttl, 'revoked');

        this.logger.info(
          {
            event: 'token.revoked',
            userId: payload.sub,
            expiresIn: ttl,
          },
          'Refresh token added to blacklist',
        );
      }
    } catch (error) {
      this.logger.warn(
        {
          event: 'token.revoke.failed',
          error: error.message,
        },
        'Token revocation failed',
      );
      // Don't throw - revocation should be best-effort
    }
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration time format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 60 * 60;
      case 'd':
        return numValue * 24 * 60 * 60;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }
}
