import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PinoLoggerService } from '../common/logging/pino-logger.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ErrorCode } from '../common/errors/error-codes.enum';
import { TenantsService } from '../tenancy/tenants.service';
import { TokenService } from './token.service';
import { SecurityConfigService } from '../common/config/security.config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: PinoLoggerService,
    private tenantsService: TenantsService,
    private tokenService: TokenService,
    private securityConfig: SecurityConfigService,
  ) {}

  async register(registerDto: RegisterDto, tenantId?: string) {
    // التحقق من وجود المستخدم
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email already exists',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    // تشفير كلمة المرور
    const config = this.securityConfig.getSecurityConfig();
    const hashedPassword = await bcrypt.hash(registerDto.password, config.bcrypt.saltRounds);

    // إنشاء المستخدم
    // Ensure tenantId if code provided
    let resolvedTenantId = tenantId || registerDto['tenantId'] || null;
    if (!resolvedTenantId) {
      try {
        const defaultTenant = await this.tenantsService.findByCodeOrId(
          (process.env.DEFAULT_TENANT_CODE || 'default').toLowerCase(),
        );
        if (defaultTenant) resolvedTenantId = defaultTenant.id;
      } catch {}
    }

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      tenantId: resolvedTenantId,
    });

    // إنشاء JWT token pair
    const tokenPair = await this.tokenService.generateTokenPair(user);

    this.logger.info(
      { event: 'user.registered', userId: user.id, email: user.email },
      'User registered',
    );
    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // العثور على المستخدم
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    // إنشاء JWT token pair
    const tokenPair = await this.tokenService.generateTokenPair(user);

    this.logger.info(
      { event: 'user.login', userId: user.id, email: user.email },
      'User logged in',
    );

    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      expires_in: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const tokenPair = await this.tokenService.refreshAccessToken(refreshToken);
      
      this.logger.info(
        { event: 'token.refreshed' },
        'Token refreshed successfully',
      );
      
      return {
        access_token: tokenPair.accessToken,
        refresh_token: tokenPair.refreshToken,
        expires_in: tokenPair.expiresIn,
      };
    } catch (error) {
      this.logger.warn(
        { event: 'token.refresh.failed', error: error.message },
        'Token refresh failed',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.tokenService.revokeRefreshToken(refreshToken);
    
    this.logger.info(
      { event: 'user.logout' },
      'User logged out',
    );
    
    return { message: 'Logged out successfully' };
  }
}