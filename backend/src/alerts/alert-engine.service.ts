import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AlertRule, AlertCondition } from './entities/alert-rule.entity';
import { Alert } from './entities/alert.entity';
import { WaterQualityReading } from '../water-quality/entities/water-quality-reading.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertEngineService {
  private readonly logger = new Logger(AlertEngineService.name);

  // Default thresholds for different parameters
  private readonly defaultThresholds = {
    temperature: { min: 20, max: 30, criticalMin: 15, criticalMax: 35, unit: '°C' },
    ph: { min: 6.5, max: 8.5, criticalMin: 6.0, criticalMax: 9.0, unit: 'pH' },
    dissolvedOxygen: { min: 5, max: 12, criticalMin: 3, criticalMax: 15, unit: 'mg/L' },
    ammonia: { min: 0, max: 0.5, criticalMin: 0, criticalMax: 1.0, unit: 'mg/L' },
    nitrite: { min: 0, max: 0.1, criticalMin: 0, criticalMax: 0.5, unit: 'mg/L' },
    nitrate: { min: 0, max: 50, criticalMin: 0, criticalMax: 100, unit: 'mg/L' },
    salinity: { min: 30, max: 40, criticalMin: 25, criticalMax: 45, unit: 'ppt' },
    turbidity: { min: 0, max: 5, criticalMin: 0, criticalMax: 10, unit: 'NTU' },
  };

  constructor(
    @InjectRepository(AlertRule)
    private alertRulesRepository: Repository<AlertRule>,
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @InjectRepository(WaterQualityReading)
    private waterQualityRepository: Repository<WaterQualityReading>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Process water quality reading and check for alerts
   */
  async processWaterQualityReading(reading: WaterQualityReading): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Get active alert rules for this tenant and pond
      const rules = await this.alertRulesRepository.find({
        where: [
          { tenantId: reading.tenantId, isActive: true, pondId: reading.pondId },
          { tenantId: reading.tenantId, isActive: true, pondId: IsNull() },
        ],
      });

      for (const rule of rules) {
        // Check cooldown period
        if (this.isInCooldown(rule)) {
          continue;
        }

        // Check if rule conditions are met
        const isTriggered = this.evaluateConditions(rule.conditions, reading);

        if (isTriggered) {
          const alert = await this.createAlert(rule, reading);
          if (alert) {
            alerts.push(alert);
            await this.updateRuleTriggerCount(rule);
          }
        }
      }

      // Also check default thresholds if no custom rules exist
      if (rules.length === 0) {
        const defaultAlerts = await this.checkDefaultThresholds(reading);
        alerts.push(...defaultAlerts);
      }

      // Send notifications for new alerts
      for (const alert of alerts) {
        await this.sendAlertNotification(alert);
      }
    } catch (error) {
      this.logger.error(
        `Error processing water quality reading for alerts: ${error.message}`,
        error.stack,
      );
    }

    return alerts;
  }

  /**
   * Evaluate alert rule conditions against water quality reading
   */
  private evaluateConditions(conditions: AlertCondition[], reading: WaterQualityReading): boolean {
    return conditions.every((condition) => {
      const value = this.getParameterValue(reading, condition.parameter);
      if (value === null || value === undefined) {
        return false;
      }

      return this.evaluateCondition(value, condition);
    });
  }

  /**
   * Get parameter value from water quality reading
   */
  private getParameterValue(reading: WaterQualityReading, parameter: string): number | null {
    const parameterMap = {
      temperature: reading.temperature,
      ph: reading.ph,
      dissolvedOxygen: reading.dissolvedOxygen,
      ammonia: reading.ammonia,
      nitrite: reading.nitrite,
      nitrate: reading.nitrate,
      salinity: reading.salinity,
      turbidity: reading.turbidity,
      alkalinity: reading.alkalinity,
      hardness: reading.hardness,
    };

    return parameterMap[parameter] || null;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'gt':
        return typeof condition.value === 'number' ? value > condition.value : false;
      case 'gte':
        return typeof condition.value === 'number' ? value >= condition.value : false;
      case 'lt':
        return typeof condition.value === 'number' ? value < condition.value : false;
      case 'lte':
        return typeof condition.value === 'number' ? value <= condition.value : false;
      case 'eq':
        return typeof condition.value === 'number'
          ? Math.abs(value - condition.value) < 0.01
          : false;
      case 'neq':
        return typeof condition.value === 'number'
          ? Math.abs(value - condition.value) >= 0.01
          : false;
      case 'between':
        const [min, max] = condition.value as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  /**
   * Check if rule is in cooldown period
   */
  private isInCooldown(rule: AlertRule): boolean {
    if (rule.cooldownMinutes === 0 || !rule.lastTriggeredAt) {
      return false;
    }

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - rule.lastTriggeredAt.getTime();

    return timeSinceLastTrigger < cooldownMs;
  }

  /**
   * Create alert from triggered rule
   */
  private async createAlert(rule: AlertRule, reading: WaterQualityReading): Promise<Alert | null> {
    try {
      const alert = this.alertsRepository.create({
        tenantId: reading.tenantId,
        pondId: reading.pondId,
        waterQualityReadingId: reading.id,
        alertRuleId: rule.id,
        title: rule.name,
        message: this.generateAlertMessage(rule, reading),
        severity: rule.severity,
        status: 'active',
        triggeredBy: this.getTriggeredBy(rule, reading),
        metadata: {
          readingData: {
            temperature: reading.temperature,
            ph: reading.ph,
            dissolvedOxygen: reading.dissolvedOxygen,
            ammonia: reading.ammonia,
          },
          ruleName: rule.name,
          notificationSent: false,
        },
      });

      return await this.alertsRepository.save(alert);
    } catch (error) {
      this.logger.error(`Error creating alert: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Check default thresholds for parameters
   */
  private async checkDefaultThresholds(reading: WaterQualityReading): Promise<Alert[]> {
    const alerts: Alert[] = [];

    for (const [parameter, thresholds] of Object.entries(this.defaultThresholds)) {
      const value = this.getParameterValue(reading, parameter);
      if (value === null || value === undefined) continue;

      let severity: 'warning' | 'critical' = 'warning';
      let message = '';

      if (value < thresholds.criticalMin || value > thresholds.criticalMax) {
        severity = 'critical';
        message = `${parameter} is critically ${value < thresholds.criticalMin ? 'low' : 'high'}: ${value}${thresholds.unit}`;
      } else if (value < thresholds.min || value > thresholds.max) {
        severity = 'warning';
        message = `${parameter} is ${value < thresholds.min ? 'low' : 'high'}: ${value}${thresholds.unit}`;
      }

      if (message) {
        const alert = this.alertsRepository.create({
          tenantId: reading.tenantId,
          pondId: reading.pondId,
          waterQualityReadingId: reading.id,
          title: `Default ${parameter} Alert`,
          message,
          severity,
          status: 'active',
          triggeredBy: {
            parameter,
            value,
            threshold: value < thresholds.min ? thresholds.min : thresholds.max,
            operator: value < thresholds.min ? 'lt' : 'gt',
          },
          metadata: {
            readingData: { [parameter]: value },
            ruleName: 'Default Threshold',
            notificationSent: false,
          },
        });

        alerts.push(await this.alertsRepository.save(alert));
      }
    }

    return alerts;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, reading: WaterQualityReading): string {
    if (rule.customMessage) {
      return rule.customMessage;
    }

    const pondInfo = reading.pondId ? ` in Pond ${reading.pondId}` : '';
    return `Alert: ${rule.name}${pondInfo} - Water quality reading triggered alert conditions.`;
  }

  /**
   * Get triggered by information
   */
  private getTriggeredBy(rule: AlertRule, reading: WaterQualityReading): any {
    if (rule.conditions.length === 0) return null;

    const firstCondition = rule.conditions[0];
    const value = this.getParameterValue(reading, firstCondition.parameter);

    return {
      parameter: firstCondition.parameter,
      value,
      threshold: firstCondition.value,
      operator: firstCondition.operator,
    };
  }

  /**
   * Update rule trigger count and last triggered time
   */
  private async updateRuleTriggerCount(rule: AlertRule): Promise<void> {
    await this.alertRulesRepository.update(rule.id, {
      triggerCount: rule.triggerCount + 1,
      lastTriggeredAt: new Date(),
    });
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      const priorityMap: Record<string, string> = {
        critical: 'high',
        warning: 'medium',
        info: 'low',
      };
      await this.notificationsService.create(
        {
          title: alert.title,
          message: alert.message,
          type: 'alert',
          category: 'water_quality',
          priority: priorityMap[alert.severity] || 'low',
          data: {
            alertId: alert.id,
            pondId: alert.pondId,
            triggeredBy: alert.triggeredBy,
            severity: alert.severity,
          },
        },
        alert.tenantId,
      );

      // Update alert metadata
      await this.alertsRepository.update(alert.id, {
        metadata: {
          ...alert.metadata,
          notificationSent: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error sending alert notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Get active alerts for tenant
   */
  async getActiveAlerts(tenantId: string, pondId?: string): Promise<Alert[]> {
    const where: any = { tenantId, status: 'active' };
    if (pondId) {
      where.pondId = pondId;
    }

    return await this.alertsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['pond', 'waterQualityReading'],
    });
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    const alert = await this.alertsRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    return await this.alertsRepository.save(alert);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<Alert> {
    const alert = await this.alertsRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = resolutionNotes;

    return await this.alertsRepository.save(alert);
  }
}
