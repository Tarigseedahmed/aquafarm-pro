import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly redis: RedisService) {}
  @Public()
  @Get()
  getHello(): string {
    return 'AquaFarm Pro API is running! 🐟';
  }

  @Public()
  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AquaFarm Pro Backend',
      redis: {
        enabled: this.redis?.isEnabled() || false,
      },
    };
  }

  @Get('test')
  getTest(): object {
    return {
      message: 'Test endpoint working!',
      auth_status: 'JWT Authentication enabled',
      endpoints: {
        auth: '/auth',
        users: '/users',
        protected: '/protected',
      },
      data: {
        farms: 'Available at /api/farms/test/mock',
        waterQuality: 'Available at /api/water-quality/test/mock',
        notifications: 'Available at /api/notifications/test/mock',
        ponds: 'Coming soon...',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected(@Request() req): object {
    return {
      message: 'This is a protected endpoint!',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
  // Removed deprecated placeholder /farms (real FarmsModule provides /farms with auth + pagination)
}
