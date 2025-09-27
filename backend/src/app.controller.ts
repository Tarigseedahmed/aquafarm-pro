import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return 'AquaFarm Pro API is running! ðŸŸ';
  }

  @Public()
  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AquaFarm Pro Backend',
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

  @Get('farms')
  getFarms(): object {
    return {
      message: 'Mock Farms Data',
      data: [
        {
          id: '1',
          name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø£Ø³Ù…Ø§Ùƒ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©',
          location: 'Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
          totalArea: 50000,
          pondCount: 5,
          status: 'active',
        },
        {
          id: '2',
          name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø²Ø±Ù‚',
          location: 'Ø¬Ø¯Ø©ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
          totalArea: 75000,
          pondCount: 8,
          status: 'active',
        },
      ],
      total: 2,
      timestamp: new Date().toISOString(),
    };
  }

  // Removed deprecated placeholder /ponds endpoint (real ponds module active)
}
