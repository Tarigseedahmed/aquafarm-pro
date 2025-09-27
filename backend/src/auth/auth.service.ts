import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PinoLoggerService } from '../common/logging/pino-logger.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { TenantsService } from '../tenancy/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: PinoLoggerService,
    private tenantsService: TenantsService,
  ) {}

  async register(registerDto: RegisterDto, tenantId?: string) {
    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // ØªØ´ÙÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
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

    // Ø¥Ù†Ø´Ø§Ø¡ JWT token
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const token = await this.jwtService.signAsync(payload);

    this.logger.info(
      { event: 'user.registered', userId: user.id, email: user.email },
      'User registered',
    );
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ø¥Ù†Ø´Ø§Ø¡ JWT token
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
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

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
    };
  }
}
