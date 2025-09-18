import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditLoggingService } from './audit-logging.service';

export interface CoolingPeriodMetadata {
  coolingPeriodActive?: boolean;
  coolingPeriodEnd?: string;
}

export interface AuthAnomaly {
  type:
    | 'brute_force'
    | 'unusual_location'
    | 'suspicious_pattern'
    | 'failed_login_spike'
    | 'account_takeover'
    | 'sim_swap_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string | undefined;
  ipAddress: string;
  userAgent: string | undefined;
  location: string | undefined;
  deviceFingerprint: string | undefined;
  description: string;
  metadata: Record<string, unknown>;
  detectedAt: Date;
}

export interface MonitoringConfig {
  alertThresholds: {
    failedLoginAttempts: number;
    suspiciousLocationChanges: number;
    bruteForceAttempts: number;
    accountTakeoverIndicators: number;
  };
  monitoringWindows: {
    shortTermMinutes: number; // 15 minutes
    mediumTermHours: number; // 1 hour
    longTermHours: number; // 24 hours
  };
  anomalyDetection: {
    enabled: boolean;
    machineLearningEnabled: boolean;
    alertOnFirstDetection: boolean;
  };
}

@Injectable()
export class AuthMonitoringService {
  private readonly logger = new Logger(AuthMonitoringService.name);
  private readonly config: MonitoringConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLoggingService: AuditLoggingService,
    @InjectQueue('auth-monitoring') private readonly monitoringQueue: Queue
  ) {
    this.config = {
      alertThresholds: {
        failedLoginAttempts: parseInt(
          this.configService.get('AUTH_FAILED_LOGIN_THRESHOLD', '5')
        ),
        suspiciousLocationChanges: parseInt(
          this.configService.get('AUTH_LOCATION_CHANGE_THRESHOLD', '3')
        ),
        bruteForceAttempts: parseInt(
          this.configService.get('AUTH_BRUTE_FORCE_THRESHOLD', '10')
        ),
        accountTakeoverIndicators: parseInt(
          this.configService.get('AUTH_TAKEOVER_INDICATORS', '3')
        ),
      },
      monitoringWindows: {
        shortTermMinutes: parseInt(
          this.configService.get('AUTH_SHORT_TERM_WINDOW_MINUTES', '15')
        ),
        mediumTermHours: parseInt(
          this.configService.get('AUTH_MEDIUM_TERM_WINDOW_HOURS', '1')
        ),
        longTermHours: parseInt(
          this.configService.get('AUTH_LONG_TERM_WINDOW_HOURS', '24')
        ),
      },
      anomalyDetection: {
        enabled:
          this.configService.get('AUTH_ANOMALY_DETECTION_ENABLED', 'true') ===
          'true',
        machineLearningEnabled:
          this.configService.get('AUTH_ML_DETECTION_ENABLED', 'false') ===
          'true',
        alertOnFirstDetection:
          this.configService.get('AUTH_ALERT_FIRST_DETECTION', 'true') ===
          'true',
      },
    };
  }

  /**
   * Monitor authentication events and detect anomalies
   */
  async monitorAuthEvent(
    eventType: string,
    userId: string | null,
    context: {
      ipAddress: string;
      userAgent?: string;
      location?: string;
      deviceFingerprint?: string;
      success: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      // Add event to monitoring queue for async processing
      await this.monitoringQueue.add('process-auth-event', {
        eventType,
        userId,
        context,
        timestamp: new Date(),
      });

      // Process critical events immediately
      if (this.isCriticalEvent(eventType, context.success)) {
        await this.processCriticalEvent(eventType, userId, context);
      }
    } catch (error) {
      this.logger.error('Failed to monitor auth event:', error);
    }
  }

  /**
   * Check if event is critical and needs immediate processing
   */
  private isCriticalEvent(eventType: string, success: boolean): boolean {
    const criticalEvents = [
      'login_failure',
      'password_reset_failure',
      'mfa_failure',
      'suspicious_login_attempt',
      'account_lockout',
    ];

    return criticalEvents.includes(eventType) && !success;
  }

  /**
   * Process critical authentication events immediately
   */
  private async processCriticalEvent(
    eventType: string,
    userId: string | null,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      // Check for immediate anomalies
      const anomalies = await this.detectImmediateAnomalies(
        eventType,
        userId,
        context
      );

      for (const anomaly of anomalies) {
        await this.handleAnomaly(anomaly);
      }

      // Update user security metrics
      if (userId) {
        await this.updateUserSecurityMetrics(
          userId,
          eventType,
          context.success as boolean
        );
      }
    } catch (error) {
      this.logger.error('Failed to process critical event:', error);
    }
  }

  /**
   * Detect immediate anomalies that require instant response
   */
  private async detectImmediateAnomalies(
    eventType: string,
    userId: string | null,
    context: Record<string, unknown>
  ): Promise<AuthAnomaly[]> {
    const anomalies: AuthAnomaly[] = [];

    try {
      // Brute force detection
      if (eventType === 'login_failure') {
        const failedAttempts = await this.getFailedLoginAttempts(
          context.ipAddress as string,
          this.config.monitoringWindows.shortTermMinutes
        );

        if (failedAttempts >= this.config.alertThresholds.bruteForceAttempts) {
          anomalies.push({
            type: 'brute_force',
            severity: 'high',
            userId: userId || undefined,
            ipAddress: context.ipAddress as string,
            userAgent: context.userAgent as string,
            location: context.location as string,
            deviceFingerprint: context.deviceFingerprint as string,
            description: `Brute force attack detected: ${failedAttempts} failed login attempts from ${context.ipAddress}`,
            metadata: {
              failedAttempts,
              timeWindow: `${this.config.monitoringWindows.shortTermMinutes} minutes`,
              eventType,
            },
            detectedAt: new Date(),
          });
        }
      }

      // Account takeover indicators
      if (userId && eventType === 'suspicious_login_attempt') {
        const takeoverIndicators = await this.getAccountTakeoverIndicators(
          userId,
          this.config.monitoringWindows.mediumTermHours
        );

        if (
          takeoverIndicators >=
          this.config.alertThresholds.accountTakeoverIndicators
        ) {
          anomalies.push({
            type: 'account_takeover',
            severity: 'critical',
            userId,
            ipAddress: context.ipAddress as string,
            userAgent: context.userAgent as string,
            location: context.location as string,
            deviceFingerprint: context.deviceFingerprint as string,
            description: `Potential account takeover detected for user ${userId}`,
            metadata: {
              takeoverIndicators,
              timeWindow: `${this.config.monitoringWindows.mediumTermHours} hours`,
              eventType,
            },
            detectedAt: new Date(),
          });
        }
      }

      // SIM swap attempt detection
      if (
        eventType === 'phone_number_change' &&
        (context.metadata as CoolingPeriodMetadata)?.coolingPeriodActive
      ) {
        anomalies.push({
          type: 'sim_swap_attempt',
          severity: 'high',
          userId: userId || undefined,
          ipAddress: context.ipAddress as string,
          userAgent: context.userAgent as string,
          location: context.location as string,
          deviceFingerprint: context.deviceFingerprint as string,
          description: `SIM swap attempt detected: Phone number changed during cooling period`,
          metadata: {
            coolingPeriodEnd: (context.metadata as CoolingPeriodMetadata)
              ?.coolingPeriodEnd,
            eventType,
          },
          detectedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Failed to detect immediate anomalies:', error);
    }

    return anomalies;
  }

  /**
   * Handle detected anomalies by logging and alerting
   */
  private async handleAnomaly(anomaly: AuthAnomaly): Promise<void> {
    try {
      // Log the anomaly
      this.logger.warn(
        `🚨 ${anomaly.severity.toUpperCase()} AUTH ANOMALY: ${anomaly.description}`,
        {
          type: anomaly.type,
          severity: anomaly.severity,
          userId: anomaly.userId,
          ipAddress: anomaly.ipAddress,
          metadata: anomaly.metadata,
        }
      );

      // Store anomaly in database for analysis
      await this.storeAnomaly(anomaly);

      // Send alert based on severity
      await this.sendAnomalyAlert(anomaly);

      // Log to audit system
      await this.auditLoggingService.logSecurityEvent({
        eventType: 'auth_anomaly',
        severity: anomaly.severity,
        userId: anomaly.userId,
        ipAddress: anomaly.ipAddress,
        userAgent: anomaly.userAgent,
        description: anomaly.description,
        eventData: {
          anomalyType: anomaly.type,
          detectionMethod: 'real-time-monitoring',
          ...anomaly.metadata,
        },
      });
    } catch (error) {
      this.logger.error('Failed to handle anomaly:', error);
    }
  }

  /**
   * Store anomaly in database for analysis and reporting
   */
  private async storeAnomaly(anomaly: AuthAnomaly): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: `auth_anomaly_${anomaly.type}`,
          entityType: 'user',
          entityId: anomaly.userId ?? null,
          userId: anomaly.userId ?? null,
          userEmail: anomaly.userId
            ? await this.getUserEmail(anomaly.userId)
            : null,
          ipAddress: anomaly.ipAddress,
          userAgent: anomaly.userAgent ?? null,
          location: anomaly.location ?? null,
          deviceFingerprint: anomaly.deviceFingerprint ?? null,
          riskScore: this.getSeverityScore(anomaly.severity),
          complianceFlags: [`anomaly_${anomaly.type}`],
          eventData: anomaly.metadata as any,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store anomaly:', error);
    }
  }

  /**
   * Send alerts based on anomaly severity
   */
  private async sendAnomalyAlert(anomaly: AuthAnomaly): Promise<void> {
    try {
      // In a production system, this would integrate with your alerting system
      // For now, we'll log the alert and could send to SNS, email, Slack, etc.

      const alertMessage = this.formatAlertMessage(anomaly);

      // Send to different channels based on severity
      switch (anomaly.severity) {
        case 'critical':
          await this.sendCriticalAlert(alertMessage, anomaly);
          break;
        case 'high':
          await this.sendHighPriorityAlert(alertMessage, anomaly);
          break;
        case 'medium':
          await this.sendMediumPriorityAlert(alertMessage, anomaly);
          break;
        case 'low':
          await this.sendLowPriorityAlert(alertMessage, anomaly);
          break;
      }
    } catch (error) {
      this.logger.error('Failed to send anomaly alert:', error);
    }
  }

  /**
   * Format alert message for different channels
   */
  private formatAlertMessage(anomaly: AuthAnomaly): string {
    return `
🚨 AUTHENTICATION ANOMALY ALERT

Severity: ${anomaly.severity.toUpperCase()}
Type: ${anomaly.type.replace('_', ' ').toUpperCase()}
User ID: ${anomaly.userId || 'Unknown'}
IP Address: ${anomaly.ipAddress}
Location: ${anomaly.location || 'Unknown'}
Time: ${anomaly.detectedAt.toISOString()}

Description: ${anomaly.description}

Metadata: ${JSON.stringify(anomaly.metadata, null, 2)}
    `.trim();
  }

  /**
   * Send critical severity alerts (immediate action required)
   */
  private async sendCriticalAlert(
    message: string,
    anomaly: AuthAnomaly
  ): Promise<void> {
    this.logger.error(`🚨 CRITICAL ALERT: ${message}`);

    // In production, send to:
    // - SMS to security team
    // - Email to security team
    // - Slack/Teams emergency channel
    // - PagerDuty/Incident management system

    // For now, we'll just log it
    await this.createAlertRecord('critical', message, anomaly);
  }

  /**
   * Send high priority alerts
   */
  private async sendHighPriorityAlert(
    message: string,
    anomaly: AuthAnomaly
  ): Promise<void> {
    this.logger.warn(`⚠️ HIGH PRIORITY ALERT: ${message}`);

    // Send to email and monitoring dashboard
    await this.createAlertRecord('high', message, anomaly);
  }

  /**
   * Send medium priority alerts
   */
  private async sendMediumPriorityAlert(
    message: string,
    anomaly: AuthAnomaly
  ): Promise<void> {
    this.logger.warn(`📊 MEDIUM ALERT: ${message}`);

    // Send to monitoring dashboard only
    await this.createAlertRecord('medium', message, anomaly);
  }

  /**
   * Send low priority alerts
   */
  private async sendLowPriorityAlert(
    message: string,
    anomaly: AuthAnomaly
  ): Promise<void> {
    this.logger.log(`ℹ️ LOW PRIORITY ALERT: ${message}`);

    // Log only, no external alerts
    await this.createAlertRecord('low', message, anomaly);
  }

  /**
   * Get monitoring statistics for dashboard
   */
  async getMonitoringStats(
    timeRangeHours: number = 24
  ): Promise<Record<string, unknown>> {
    try {
      const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

      const stats = await this.prisma.auditLog.groupBy({
        by: ['eventType'],
        where: {
          createdAt: { gte: since },
          eventType: { startsWith: 'auth_' },
        },
        _count: {
          id: true,
        },
      });

      return {
        timeRange: `${timeRangeHours} hours`,
        stats: stats.reduce(
          (acc: Record<string, number>, stat) => {
            acc[stat.eventType] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } catch (error) {
      this.logger.error('Failed to get monitoring stats:', error);
      return { error: 'Failed to retrieve monitoring statistics' };
    }
  }

  /**
   * Create alert record in database
   */
  private async createAlertRecord(
    severity: string,
    message: string,
    anomaly: AuthAnomaly
  ): Promise<void> {
    try {
      // In a real implementation, you'd have an alerts table
      // For now, we'll just log to audit system
      await this.auditLoggingService.logSecurityEvent({
        eventType: 'auth_alert',
        severity,
        userId: anomaly.userId,
        ipAddress: anomaly.ipAddress,
        userAgent: anomaly.userAgent,
        description: `Auth alert: ${message}`,
        eventData: {
          anomalyType: anomaly.type,
          alertMessage: message,
          alertSeverity: severity,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create alert record:', error);
    }
  }

  /**
   * Update user security metrics after authentication events
   */
  private async updateUserSecurityMetrics(
    userId: string,
    _eventType: string,
    success: boolean
  ): Promise<void> {
    try {
      if (!success) {
        // Increment failed login attempts
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            loginAttempts: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      } else {
        // Reset failed login attempts on successful login
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            loginAttempts: 0,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Update risk score based on recent activity
      await this.updateUserRiskScore(userId);
    } catch (error) {
      this.logger.error('Failed to update user security metrics:', error);
    }
  }

  /**
   * Update user risk score based on recent activity
   */
  private async updateUserRiskScore(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          loginAttempts: true,
          riskScore: true,
          lastLoginAt: true,
        },
      });

      if (!user) return;

      let newRiskScore = user.riskScore || 0;

      // Increase risk score based on failed attempts
      if (user.loginAttempts > 0) {
        newRiskScore += user.loginAttempts * 10;
      }

      // Cap risk score at 100
      newRiskScore = Math.min(newRiskScore, 100);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          riskScore: newRiskScore,
          riskAssessedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to update user risk score:', error);
    }
  }

  /**
   * Get failed login attempts for IP address within time window
   */
  private async getFailedLoginAttempts(
    ipAddress: string,
    minutes: number
  ): Promise<number> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);

      const failedAttempts = await this.prisma.auditLog.count({
        where: {
          ipAddress,
          eventType: 'login_failure',
          createdAt: { gte: since },
        },
      });

      return failedAttempts;
    } catch (error) {
      this.logger.error('Failed to get failed login attempts:', error);
      return 0;
    }
  }

  /**
   * Get account takeover indicators for user
   */
  private async getAccountTakeoverIndicators(
    userId: string,
    hours: number
  ): Promise<number> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const indicators = await this.prisma.auditLog.count({
        where: {
          userId,
          eventType: {
            in: [
              'suspicious_login_attempt',
              'password_reset_failure',
              'mfa_failure',
              'unusual_location_login',
            ],
          },
          createdAt: { gte: since },
        },
      });

      return indicators;
    } catch (error) {
      this.logger.error('Failed to get account takeover indicators:', error);
      return 0;
    }
  }

  /**
   * Get user email for audit logging
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      return user?.email || null;
    } catch (error) {
      this.logger.error('Failed to get user email:', error);
      return null;
    }
  }

  /**
   * Convert severity to numeric score
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical':
        return 100;
      case 'high':
        return 75;
      case 'medium':
        return 50;
      case 'low':
        return 25;
      default:
        return 0;
    }
  }
}
