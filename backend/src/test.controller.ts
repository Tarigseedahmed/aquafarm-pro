/**
 * AquaFarm Pro - Test Controller
 * Simple endpoints to test the application
 */

import { Controller, Get, Post, Body } from '@nestjs/common';

interface TestFarm {
  id: string;
  name: string;
  location: string;
  status: string;
}

@Controller('test')
export class TestController {
  private farms: TestFarm[] = [
    {
      id: '1',
      name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø£Ø³Ù…Ø§Ùƒ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©',
      location: 'Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
      status: 'active',
    },
    {
      id: '2',
      name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø²Ø±Ù‚',
      location: 'Ø¬Ø¯Ø©ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
      status: 'active',
    },
  ];

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'AquaFarm Pro Backend is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('farms')
  getFarms() {
    return {
      success: true,
      data: this.farms,
      count: this.farms.length,
    };
  }

  @Post('farms')
  createFarm(@Body() farmData: Partial<TestFarm>) {
    const newFarm: TestFarm = {
      id: Date.now().toString(),
      name: farmData.name || 'Ù…Ø²Ø±Ø¹Ø© Ø¬Ø¯ÙŠØ¯Ø©',
      location: farmData.location || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯',
      status: 'active',
    };

    this.farms.push(newFarm);

    return {
      success: true,
      message: 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø¨Ù†Ø¬Ø§Ø­',
      data: newFarm,
    };
  }

  @Get('ponds')
  getPonds() {
    return {
      success: true,
      data: [
        {
          id: '1',
          farmId: '1',
          name: 'Ø­ÙˆØ¶ Ø±Ù‚Ù… 1',
          area: 1000,
          depth: 2.5,
          capacity: 5000,
          status: 'active',
        },
        {
          id: '2',
          farmId: '1',
          name: 'Ø­ÙˆØ¶ Ø±Ù‚Ù… 2',
          area: 800,
          depth: 2.0,
          capacity: 3000,
          status: 'maintenance',
        },
      ],
      count: 2,
    };
  }

  @Get('config')
  getConfig() {
    return {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      database: process.env.DATABASE_HOST ? 'PostgreSQL' : 'SQLite',
      timestamp: new Date().toISOString(),
    };
  }
}
