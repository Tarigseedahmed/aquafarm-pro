import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../logging/pino-logger.service';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  };
  details: {
    description: string;
    endpoint?: string;
    method?: string;
    payload?: any;
    response?: any;
    error?: string;
  };
  metadata: {
    requestId?: string;
    tenantId?: string;
    userRole?: string;
    location?: string;
    device?: string;
  };
}

export type SecurityEventType =
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHENTICATION_SUCCESS'
  | 'AUTHORIZATION_FAILURE'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'MALICIOUS_INPUT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'FILE_UPLOAD_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_ACCESS_VIOLATION'
  | 'SESSION_HIJACKING'
  | 'API_ABUSE'
  | 'SECURITY_HEADER_VIOLATION'
  | 'INJECTION_ATTEMPT'
  | 'DIRECTORY_TRAVERSAL'
  | 'COMMAND_INJECTION'
  | 'LDAP_INJECTION'
  | 'NO_SQL_INJECTION'
  | 'PATH_TRAVERSAL'
  | 'SECURITY_CONFIGURATION_ERROR'
  | 'VULNERABILITY_SCAN'
  | 'MALWARE_DETECTED'
  | 'ANOMALY_DETECTED';

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  eventsByHour: Record<string, number>;
  topSourceIPs: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  blockedIPs: number;
  suspiciousIPs: number;
  riskScore: number;
}

export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
  };
  actions: string[];
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  assignedTo?: string;
  notes?: string;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private readonly maxEventsHistory = 10000;
  private readonly maxAlertsHistory = 1000;
  private blockedIPs = new Set<string>();
  private suspiciousIPs = new Set<string>();
  private ipAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  constructor(
    private configService: ConfigService,
    private pinoLogger: PinoLoggerService,
  ) {}

  /**
   * Record a security event
   */
  recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEventsHistory) {
      this.events = this.events.slice(-this.maxEventsHistory);
    }

    // Log the security event
    this.pinoLogger.warn(
      {
        event: 'security.event.recorded',
        type: securityEvent.type,
        severity: securityEvent.severity,
        source: securityEvent.source,
        details: securityEvent.details,
        metadata: securityEvent.metadata,
      },
      `Security event recorded: ${securityEvent.type} - ${securityEvent.details.description}`
    );

    // Check for patterns and generate alerts
    this.analyzeSecurityEvent(securityEvent);

    // Update IP tracking
    this.updateIPTracking(securityEvent);
  }

  /**
   * Analyze security event for patterns and threats
   */
  private analyzeSecurityEvent(event: SecurityEvent): void {
    // Check for brute force attempts
    if (this.isBruteForceAttempt(event)) {
      this.createSecurityAlert({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'high',
        title: 'Brute Force Attack Detected',
        description: `Multiple failed authentication attempts from IP ${event.source.ip}`,
        source: event.source,
        actions: ['Block IP', 'Increase rate limiting', 'Notify security team'],
      });
    }

    // Check for suspicious activity patterns
    if (this.isSuspiciousActivity(event)) {
      this.createSecurityAlert({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        title: 'Suspicious Activity Detected',
        description: `Unusual activity pattern detected from IP ${event.source.ip}`,
        source: event.source,
        actions: ['Monitor IP', 'Review logs', 'Consider blocking'],
      });
    }

    // Check for injection attempts
    if (this.isInjectionAttempt(event)) {
      this.createSecurityAlert({
        type: 'INJECTION_ATTEMPT',
        severity: 'critical',
        title: 'Injection Attack Detected',
        description: `Injection attempt detected from IP ${event.source.ip}`,
        source: event.source,
        actions: ['Block IP immediately', 'Review application logs', 'Notify security team'],
      });
    }

    // Check for privilege escalation
    if (this.isPrivilegeEscalation(event)) {
      this.createSecurityAlert({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'critical',
        title: 'Privilege Escalation Attempt',
        description: `Privilege escalation attempt detected from user ${event.source.userId}`,
        source: event.source,
        actions: ['Suspend user account', 'Review user permissions', 'Notify security team'],
      });
    }
  }

  /**
   * Create a security alert
   */
  private createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>): void {
    const securityAlert: SecurityAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
      status: 'active',
    };

    this.alerts.push(securityAlert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }

    // Log the security alert
    this.pinoLogger.error(
      {
        event: 'security.alert.created',
        type: securityAlert.type,
        severity: securityAlert.severity,
        title: securityAlert.title,
        description: securityAlert.description,
        source: securityAlert.source,
        actions: securityAlert.actions,
      },
      `Security alert created: ${securityAlert.title}`
    );

    // Send notification if configured
    this.sendSecurityNotification(securityAlert);
  }

  /**
   * Update IP tracking for threat detection
   */
  private updateIPTracking(event: SecurityEvent): void {
    const ip = event.source.ip;
    const now = new Date();

    if (!this.ipAttempts.has(ip)) {
      this.ipAttempts.set(ip, { count: 0, lastAttempt: now });
    }

    const ipData = this.ipAttempts.get(ip)!;
    ipData.count++;
    ipData.lastAttempt = now;

    // Check if IP should be blocked
    if (this.shouldBlockIP(ip, ipData)) {
      this.blockedIPs.add(ip);
      this.logger.warn(`IP ${ip} blocked due to suspicious activity`);
    }

    // Check if IP should be marked as suspicious
    if (this.shouldMarkAsSuspicious(ip, ipData)) {
      this.suspiciousIPs.add(ip);
      this.logger.warn(`IP ${ip} marked as suspicious`);
    }
  }

  /**
   * Check if IP should be blocked
   */
  private shouldBlockIP(ip: string, ipData: { count: number; lastAttempt: Date }): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - ipData.lastAttempt.getTime();
    const timeWindow = 15 * 60 * 1000; // 15 minutes

    // Block if more than 10 attempts in 15 minutes
    if (timeDiff < timeWindow && ipData.count > 10) {
      return true;
    }

    // Block if more than 50 attempts total
    if (ipData.count > 50) {
      return true;
    }

    return false;
  }

  /**
   * Check if IP should be marked as suspicious
   */
  private shouldMarkAsSuspicious(ip: string, ipData: { count: number; lastAttempt: Date }): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - ipData.lastAttempt.getTime();
    const timeWindow = 60 * 60 * 1000; // 1 hour

    // Mark as suspicious if more than 5 attempts in 1 hour
    if (timeDiff < timeWindow && ipData.count > 5) {
      return true;
    }

    return false;
  }

  /**
   * Check if event is a brute force attempt
   */
  private isBruteForceAttempt(event: SecurityEvent): boolean {
    if (event.type !== 'AUTHENTICATION_FAILURE') {
      return false;
    }

    const ip = event.source.ip;
    const ipData = this.ipAttempts.get(ip);
    
    if (!ipData) {
      return false;
    }

    const now = new Date();
    const timeDiff = now.getTime() - ipData.lastAttempt.getTime();
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    // Consider brute force if more than 5 failed attempts in 5 minutes
    return timeDiff < timeWindow && ipData.count > 5;
  }

  /**
   * Check if event is suspicious activity
   */
  private isSuspiciousActivity(event: SecurityEvent): boolean {
    // Check for rapid requests from same IP
    const ip = event.source.ip;
    const ipData = this.ipAttempts.get(ip);
    
    if (!ipData) {
      return false;
    }

    const now = new Date();
    const timeDiff = now.getTime() - ipData.lastAttempt.getTime();
    const timeWindow = 1 * 60 * 1000; // 1 minute

    // Consider suspicious if more than 20 requests in 1 minute
    return timeDiff < timeWindow && ipData.count > 20;
  }

  /**
   * Check if event is an injection attempt
   */
  private isInjectionAttempt(event: SecurityEvent): boolean {
    const injectionTypes: SecurityEventType[] = [
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'INJECTION_ATTEMPT',
      'COMMAND_INJECTION',
      'LDAP_INJECTION',
      'NO_SQL_INJECTION',
    ];

    return injectionTypes.includes(event.type);
  }

  /**
   * Check if event is privilege escalation
   */
  private isPrivilegeEscalation(event: SecurityEvent): boolean {
    return event.type === 'PRIVILEGE_ESCALATION' || event.type === 'AUTHORIZATION_FAILURE';
  }

  /**
   * Send security notification
   */
  private sendSecurityNotification(alert: SecurityAlert): void {
    // Implementation for sending notifications (email, Slack, etc.)
    this.logger.log(`Security notification sent for alert: ${alert.title}`);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(
      event => event.timestamp >= last24Hours
    );

    const eventsByType: Record<SecurityEventType, number> = {} as Record<SecurityEventType, number>;
    const eventsBySeverity: Record<string, number> = {};
    const eventsByHour: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    const endpointCounts: Record<string, number> = {};
    const userAgentCounts: Record<string, number> = {};

    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      const hour = event.timestamp.getHours().toString();
      eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
      
      ipCounts[event.source.ip] = (ipCounts[event.source.ip] || 0) + 1;
      
      if (event.details.endpoint) {
        endpointCounts[event.details.endpoint] = (endpointCounts[event.details.endpoint] || 0) + 1;
      }
      
      if (event.source.userAgent) {
        userAgentCounts[event.source.userAgent] = (userAgentCounts[event.source.userAgent] || 0) + 1;
      }
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(recentEvents);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      eventsByHour,
      topSourceIPs: Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topEndpoints: Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topUserAgents: Object.entries(userAgentCounts)
        .map(([userAgent, count]) => ({ userAgent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      riskScore,
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(events: SecurityEvent[]): number {
    let riskScore = 0;

    for (const event of events) {
      switch (event.severity) {
        case 'critical':
          riskScore += 10;
          break;
        case 'high':
          riskScore += 7;
          break;
        case 'medium':
          riskScore += 4;
          break;
        case 'low':
          riskScore += 1;
          break;
      }
    }

    // Normalize to 0-100 scale
    return Math.min(100, riskScore);
  }

  /**
   * Get security alerts
   */
  getSecurityAlerts(status?: SecurityAlert['status']): SecurityAlert[] {
    if (status) {
      return this.alerts.filter(alert => alert.status === status);
    }
    return [...this.alerts];
  }

  /**
   * Update alert status
   */
  updateAlertStatus(alertId: string, status: SecurityAlert['status'], notes?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.status = status;
    if (notes) {
      alert.notes = notes;
    }

    this.logger.log(`Alert ${alertId} status updated to ${status}`);
    return true;
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if IP is suspicious
   */
  isIPSuspicious(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Block IP manually
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.logger.log(`IP ${ip} blocked manually. Reason: ${reason}`);
  }

  /**
   * Unblock IP
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.logger.log(`IP ${ip} unblocked`);
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const metrics = this.getSecurityMetrics();
      const alerts = this.getSecurityAlerts('active');
      
      this.logger.debug(
        `Security monitoring health check: ${metrics.totalEvents} events, ${alerts.length} active alerts`
      );
      
      return true;
    } catch (error) {
      this.logger.error('Security monitoring health check failed:', error);
      return false;
    }
  }
}
