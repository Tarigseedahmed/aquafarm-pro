import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: {
    metric: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
    threshold: number;
    timeWindow: number; // seconds
    evaluationInterval: number; // seconds
  };
  notification: {
    channels: string[];
    template: string;
    cooldown: number; // seconds
  };
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  status: 'firing' | 'resolved' | 'acknowledged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  startedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  notifications: Array<{
    channel: string;
    sentAt: Date;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertTemplate {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  subject?: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private alertTemplates: Map<string, AlertTemplate> = new Map();
  private lastEvaluation: Map<string, Date> = new Map();

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new alert rule
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alertRules.set(alertRule.id, alertRule);
    
    this.logger.log(`Alert rule created: ${alertRule.name}`);
    
    return alertRule;
  }

  /**
   * Update an alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      return null;
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    this.alertRules.set(ruleId, updatedRule);
    
    this.logger.log(`Alert rule updated: ${updatedRule.name}`);
    
    return updatedRule;
  }

  /**
   * Delete an alert rule
   */
  deleteAlertRule(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      return false;
    }

    this.alertRules.delete(ruleId);
    
    // Resolve any active alerts for this rule
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (alert.ruleId === ruleId && alert.status === 'firing') {
        this.resolveAlert(alertId);
      }
    }
    
    this.logger.log(`Alert rule deleted: ${rule.name}`);
    
    return true;
  }

  /**
   * Evaluate all alert rules
   */
  async evaluateAlertRules(metrics: Record<string, number>): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) {
        continue;
      }

      const lastEval = this.lastEvaluation.get(ruleId);
      const now = new Date();
      
      if (lastEval && (now.getTime() - lastEval.getTime()) < rule.condition.evaluationInterval * 1000) {
        continue;
      }

      await this.evaluateRule(rule, metrics);
      this.lastEvaluation.set(ruleId, now);
    }
  }

  /**
   * Evaluate a specific alert rule
   */
  private async evaluateRule(rule: AlertRule, metrics: Record<string, number>): Promise<void> {
    const metricValue = metrics[rule.condition.metric];
    
    if (metricValue === undefined) {
      return;
    }

    const conditionMet = this.evaluateCondition(
      metricValue,
      rule.condition.operator,
      rule.condition.threshold
    );

    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status === 'firing');

    if (conditionMet && !existingAlert) {
      // Create new alert
      await this.createAlert(rule, metricValue);
    } else if (!conditionMet && existingAlert) {
      // Resolve existing alert
      this.resolveAlert(existingAlert.id);
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      case 'ne':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(rule: AlertRule, metricValue: number): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      status: 'firing',
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      startedAt: new Date(),
      labels: {
        rule: rule.name,
        severity: rule.severity,
        metric: rule.condition.metric,
        value: metricValue.toString(),
        ...rule.tags,
      },
      annotations: {
        description: rule.description,
        summary: `Alert ${rule.name} is firing`,
      },
      notifications: [],
    };

    this.activeAlerts.set(alert.id, alert);

    // Send notifications
    await this.sendNotifications(alert, rule);

    this.logger.warn(
      {
        event: 'alert.created',
        alertId: alert.id,
        ruleId: rule.id,
        severity: rule.severity,
        metric: rule.condition.metric,
        value: metricValue,
      },
      `Alert created: ${alert.title}`
    );
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== 'firing') {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.logger.log(
      {
        event: 'alert.resolved',
        alertId: alert.id,
        ruleId: alert.ruleId,
        duration: alert.resolvedAt.getTime() - alert.startedAt.getTime(),
      },
      `Alert resolved: ${alert.title}`
    );

    return true;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== 'firing') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.logger.log(
      {
        event: 'alert.acknowledged',
        alertId: alert.id,
        ruleId: alert.ruleId,
        acknowledgedBy,
      },
      `Alert acknowledged: ${alert.title}`
    );

    return true;
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channelId of rule.notification.channels) {
      const channel = this.notificationChannels.get(channelId);
      if (!channel || !channel.enabled) {
        continue;
      }

      const template = this.alertTemplates.get(rule.notification.template);
      if (!template) {
        continue;
      }

      try {
        await this.sendNotification(alert, channel, template);
        
        alert.notifications.push({
          channel: channelId,
          sentAt: new Date(),
          status: 'sent',
        });
      } catch (error) {
        alert.notifications.push({
          channel: channelId,
          sentAt: new Date(),
          status: 'failed',
          error: error.message,
        });
        
        this.logger.error(
          {
            event: 'alert.notification.failed',
            alertId: alert.id,
            channelId,
            error: error.message,
          },
          `Failed to send notification for alert ${alert.id}`
        );
      }
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendNotification(
    alert: Alert,
    channel: NotificationChannel,
    template: AlertTemplate,
  ): Promise<void> {
    const message = this.renderTemplate(template, alert);

    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, message);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, message);
        break;
      case 'sms':
        await this.sendSmsNotification(channel, message);
        break;
      case 'push':
        await this.sendPushNotification(channel, message);
        break;
    }
  }

  /**
   * Render alert template
   */
  private renderTemplate(template: AlertTemplate, alert: Alert): string {
    let message = template.body;
    
    // Replace variables in template
    for (const variable of template.variables) {
      const value = this.getVariableValue(variable, alert);
      message = message.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    }
    
    return message;
  }

  /**
   * Get variable value for template rendering
   */
  private getVariableValue(variable: string, alert: Alert): string {
    switch (variable) {
      case 'alert.title':
        return alert.title;
      case 'alert.description':
        return alert.description;
      case 'alert.severity':
        return alert.severity;
      case 'alert.startedAt':
        return alert.startedAt.toISOString();
      case 'alert.labels':
        return JSON.stringify(alert.labels);
      case 'alert.annotations':
        return JSON.stringify(alert.annotations);
      default:
        return `{{${variable}}}`;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implementation for email notification
    this.logger.log(`Email notification sent to ${channel.config.email}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implementation for Slack notification
    this.logger.log(`Slack notification sent to ${channel.config.webhook}`);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implementation for webhook notification
    this.logger.log(`Webhook notification sent to ${channel.config.url}`);
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implementation for SMS notification
    this.logger.log(`SMS notification sent to ${channel.config.phone}`);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(channel: NotificationChannel, message: string): Promise<void> {
    // Implementation for push notification
    this.logger.log(`Push notification sent to ${channel.config.deviceId}`);
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'firing');
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | null {
    return this.activeAlerts.get(alertId) || null;
  }

  /**
   * Get notification channels
   */
  getNotificationChannels(): NotificationChannel[] {
    return Array.from(this.notificationChannels.values());
  }

  /**
   * Create notification channel
   */
  createNotificationChannel(channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>): NotificationChannel {
    const notificationChannel: NotificationChannel = {
      ...channel,
      id: this.generateChannelId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notificationChannels.set(notificationChannel.id, notificationChannel);
    
    this.logger.log(`Notification channel created: ${notificationChannel.name}`);
    
    return notificationChannel;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'High Error Rate',
        description: 'API error rate is above 5%',
        enabled: true,
        severity: 'high',
        condition: {
          metric: 'api_error_rate',
          operator: 'gt',
          threshold: 5,
          timeWindow: 300,
          evaluationInterval: 60,
        },
        notification: {
          channels: ['default-email'],
          template: 'error-rate-template',
          cooldown: 300,
        },
        tags: {
          service: 'api',
          team: 'backend',
        },
      },
      {
        name: 'High Response Time',
        description: 'API response time is above 2 seconds',
        enabled: true,
        severity: 'medium',
        condition: {
          metric: 'api_response_time_p95',
          operator: 'gt',
          threshold: 2000,
          timeWindow: 300,
          evaluationInterval: 60,
        },
        notification: {
          channels: ['default-slack'],
          template: 'response-time-template',
          cooldown: 600,
        },
        tags: {
          service: 'api',
          team: 'backend',
        },
      },
      {
        name: 'Memory Usage High',
        description: 'Memory usage is above 80%',
        enabled: true,
        severity: 'high',
        condition: {
          metric: 'memory_usage_percentage',
          operator: 'gt',
          threshold: 80,
          timeWindow: 300,
          evaluationInterval: 60,
        },
        notification: {
          channels: ['default-email', 'default-slack'],
          template: 'memory-usage-template',
          cooldown: 300,
        },
        tags: {
          service: 'system',
          team: 'infrastructure',
        },
      },
    ];

    for (const rule of defaultRules) {
      this.createAlertRule(rule);
    }
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Default Email',
        type: 'email',
        enabled: true,
        config: {
          email: this.configService.get<string>('ALERT_EMAIL', 'alerts@aquafarm.cloud'),
          smtp: this.configService.get<string>('SMTP_HOST', 'localhost'),
        },
      },
      {
        name: 'Default Slack',
        type: 'slack',
        enabled: true,
        config: {
          webhook: this.configService.get<string>('SLACK_WEBHOOK', ''),
          channel: '#alerts',
        },
      },
    ];

    for (const channel of defaultChannels) {
      this.createNotificationChannel(channel);
    }
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<AlertTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Error Rate Template',
        type: 'email',
        subject: 'Alert: {{alert.title}}',
        body: `
          <h2>{{alert.title}}</h2>
          <p><strong>Description:</strong> {{alert.description}}</p>
          <p><strong>Severity:</strong> {{alert.severity}}</p>
          <p><strong>Started At:</strong> {{alert.startedAt}}</p>
          <p><strong>Labels:</strong> {{alert.labels}}</p>
        `,
        variables: ['alert.title', 'alert.description', 'alert.severity', 'alert.startedAt', 'alert.labels'],
      },
      {
        name: 'Response Time Template',
        type: 'slack',
        body: `
          🚨 *{{alert.title}}*
          
          *Description:* {{alert.description}}
          *Severity:* {{alert.severity}}
          *Started At:* {{alert.startedAt}}
          
          Labels: {{alert.labels}}
        `,
        variables: ['alert.title', 'alert.description', 'alert.severity', 'alert.startedAt', 'alert.labels'],
      },
    ];

    for (const template of defaultTemplates) {
      const alertTemplate: AlertTemplate = {
        ...template,
        id: this.generateTemplateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.alertTemplates.set(alertTemplate.id, alertTemplate);
    }
  }

  /**
   * Generate rule ID
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate channel ID
   */
  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const rules = this.getAlertRules();
      const activeAlerts = this.getActiveAlerts();
      const channels = this.getNotificationChannels();
      
      this.logger.debug(
        `Alerting health check: ${rules.length} rules, ${activeAlerts.length} active alerts, ${channels.length} channels`
      );
      
      return true;
    } catch (error) {
      this.logger.error('Alerting health check failed:', error);
      return false;
    }
  }
}
