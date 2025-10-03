import { Controller, Post, Body, ValidationPipe, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';
import { ThrottleAuth } from '../common/throttling/throttle-profile.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ThrottleAuth()
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto, @Request() req) {
    return this.authService.register(registerDto, req.tenantId);
  }

  // Apply a stricter rate limit to login attempts than the global default.
  // @nestjs/throttler v6 expects a map of throttler names to option objects.
  // We reference the 'global' throttler name (configured in AppModule) and override limit/ttl.
  @Post('login')
  @ThrottleAuth()
  @ApiOperation({ summary: 'Authenticate user and return JWT access token' })
  @ApiResponse({ status: 201, description: 'Successful authentication' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts (rate limited)' })
  @ApiStandardErrorResponses({
    badRequest: false,
    forbidden: false,
    notFound: false,
    conflict: false,
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
