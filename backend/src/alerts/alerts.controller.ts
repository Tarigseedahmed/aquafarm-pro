import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiStandardErrorResponses } from '../common/errors/error-responses.decorator';
import { AlertEngineService } from './alert-engine.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertEngineService: AlertEngineService) {}

  @Get('rules')
  @Permissions('alerts.read')
  @ApiOperation({ summary: 'Get alert rules for tenant' })
  @ApiResponse({ status: 200, description: 'Alert rules retrieved successfully' })
  @ApiStandardErrorResponses()
  async getAlertRules() {
    // This would need to be implemented in AlertEngineService
    // For now, return empty array
    return [];
  }

  @Post('rules')
  @Permissions('alerts.create')
  @ApiOperation({ summary: 'Create new alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  @ApiStandardErrorResponses()
  async createAlertRule(@Body(new ValidationPipe()) createDto: CreateAlertRuleDto) {
    // Implementation would go here
    void createDto;
    return { message: 'Alert rule creation not yet implemented' };
  }

  @Get()
  @Permissions('alerts.read')
  @ApiOperation({ summary: 'Get active alerts for tenant' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiStandardErrorResponses()
  async getAlerts(@Request() req, @Query('pondId') pondId?: string) {
    return this.alertEngineService.getActiveAlerts(req.tenantId, pondId);
  }

  @Get('stats')
  @Permissions('alerts.read')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved successfully' })
  @ApiStandardErrorResponses()
  async getAlertStats(@Request() req) {
    const alerts = await this.alertEngineService.getActiveAlerts(req.tenantId);

    const stats = {
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
        info: alerts.filter((a) => a.severity === 'info').length,
      },
      byStatus: {
        active: alerts.filter((a) => a.status === 'active').length,
        acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
        resolved: alerts.filter((a) => a.status === 'resolved').length,
      },
    };

    return stats;
  }

  @Patch(':id/acknowledge')
  @Permissions('alerts.update')
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @ApiStandardErrorResponses()
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body(new ValidationPipe()) acknowledgeDto: AcknowledgeAlertDto,
    @Request() req,
  ) {
    return await this.alertEngineService.acknowledgeAlert(alertId, req.user.id);
  }

  @Patch(':id/resolve')
  @Permissions('alerts.update')
  @ApiOperation({ summary: 'Resolve alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @ApiStandardErrorResponses()
  async resolveAlert(
    @Param('id') alertId: string,
    @Body(new ValidationPipe()) resolveDto: ResolveAlertDto,
    @Request() req,
  ) {
    return await this.alertEngineService.resolveAlert(
      alertId,
      req.user.id,
      resolveDto.resolutionNotes,
    );
  }

  @Get('thresholds')
  @Permissions('alerts.read')
  @ApiOperation({ summary: 'Get default water quality thresholds' })
  @ApiResponse({ status: 200, description: 'Thresholds retrieved successfully' })
  @ApiStandardErrorResponses()
  async getDefaultThresholds() {
    return {
      temperature: { min: 20, max: 30, criticalMin: 15, criticalMax: 35, unit: '°C' },
      ph: { min: 6.5, max: 8.5, criticalMin: 6.0, criticalMax: 9.0, unit: 'pH' },
      dissolvedOxygen: { min: 5, max: 12, criticalMin: 3, criticalMax: 15, unit: 'mg/L' },
      ammonia: { min: 0, max: 0.5, criticalMin: 0, criticalMax: 1.0, unit: 'mg/L' },
      nitrite: { min: 0, max: 0.1, criticalMin: 0, criticalMax: 0.5, unit: 'mg/L' },
      nitrate: { min: 0, max: 50, criticalMin: 0, criticalMax: 100, unit: 'mg/L' },
      salinity: { min: 30, max: 40, criticalMin: 25, criticalMax: 45, unit: 'ppt' },
      turbidity: { min: 0, max: 5, criticalMin: 0, criticalMax: 10, unit: 'NTU' },
    };
  }
}
