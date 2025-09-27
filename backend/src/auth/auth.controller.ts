import { Controller, Post, Body, ValidationPipe, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto, @Request() req) {
    return this.authService.register(registerDto, req.tenantId);
  }

  // Apply a stricter rate limit to login attempts than the global default.
  // @nestjs/throttler v6 expects a map of throttler names to option objects.
  // We reference the 'global' throttler name (configured in AppModule) and override limit/ttl.
  @Post('login')
  @Throttle({
    global: { limit: 5, ttl: 60 }, // 5 attempts per minute per IP for login
  })
  async login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Get('test')
  test() {
    return {
      message: 'Auth controller is working',
      timestamp: new Date().toISOString(),
    };
  }
}
