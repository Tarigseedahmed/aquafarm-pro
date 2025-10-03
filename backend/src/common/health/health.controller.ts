import { Controller, Get, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthStatus, DetailedHealthStatus } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Uptime in milliseconds' },
        version: { type: 'string' },
        environment: { type: 'string' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              duration: { type: 'number' },
              details: { type: 'object' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            healthy: { type: 'number' },
            unhealthy: { type: 'number' },
            degraded: { type: 'number' },
          },
        },
      },
    },
  })
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealthStatus();
  }

  @Get('detailed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        environment: { type: 'string' },
        checks: { type: 'array' },
        summary: { type: 'object' },
        system: {
          type: 'object',
          properties: {
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number' },
                total: { type: 'number' },
                percentage: { type: 'number' },
              },
            },
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number' },
              },
            },
            disk: {
              type: 'object',
              properties: {
                used: { type: 'number' },
                total: { type: 'number' },
                percentage: { type: 'number' },
              },
            },
          },
        },
        services: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            redis: { type: 'object' },
            cache: { type: 'object' },
            memory: { type: 'object' },
          },
        },
        performance: {
          type: 'object',
          properties: {
            responseTime: { type: 'number' },
            throughput: { type: 'number' },
            errorRate: { type: 'number' },
          },
        },
      },
    },
  })
  async getDetailedHealth(): Promise<DetailedHealthStatus> {
    return this.healthService.getDetailedHealthStatus();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get readiness status' })
  @ApiResponse({
    status: 200,
    description: 'Readiness status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              duration: { type: 'number' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  })
  async getReadiness(): Promise<{ ready: boolean; checks: any[] }> {
    return this.healthService.getReadinessStatus();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get liveness status' })
  @ApiResponse({
    status: 200,
    description: 'Liveness status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        alive: { type: 'boolean' },
        uptime: { type: 'number' },
      },
    },
  })
  async getLiveness(): Promise<{ alive: boolean; uptime: number }> {
    return this.healthService.getLivenessStatus();
  }

  @Get('service/:serviceName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get health status for specific service' })
  @ApiQuery({
    name: 'serviceName',
    description: 'Name of the service to check',
    enum: ['database', 'redis', 'cache', 'memory'],
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        duration: { type: 'number' },
        details: { type: 'object' },
      },
    },
  })
  async getServiceHealth(@Query('serviceName') serviceName: string): Promise<any> {
    return this.healthService.checkService(serviceName);
  }

  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get health check configuration' })
  @ApiResponse({
    status: 200,
    description: 'Health check configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        timeout: { type: 'number' },
        interval: { type: 'number' },
        retries: { type: 'number' },
      },
    },
  })
  async getHealthConfig(): Promise<any> {
    return this.healthService.getHealthConfig();
  }
}
