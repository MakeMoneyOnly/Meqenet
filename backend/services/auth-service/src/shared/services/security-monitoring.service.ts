import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { register, collectDefaultMetrics, Counter, Gauge, Histogram } from 'prom-client';

export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'rate_limit' | 'threat_detection' | 'anomaly' | 'encryption' | 'decryption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ThreatIndicator {
  type: 'brute_force' | 'unusual_pattern' | 'suspicious_location' | 'device_anomaly' | 'behavioral_anomaly';
  confidence: number; // 0-1 scale
  userId: string;
  indicators: string[];
  timestamp: Date;
}

@Injectable()
export class SecurityMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SecurityMonitoringService.name);

  // Prometheus metrics
  private securityEventsCounter: Counter<string>;
  private activeThreatsGauge: Gauge<string>;
  private responseTimeHistogram: Histogram<string>;
  private failedAuthenticationsCounter: Counter<string>;
  private rateLimitHitsCounter: Counter<string>;
  private encryptionOperationsCounter: Counter<string>;
  private anomalyDetectionCounter: Counter<string>;

  private threatIndicators: Map<string, ThreatIndicator[]> = new Map();
  private securityEvents: SecurityEvent[] = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.initializeMetrics();
    this.logger.log('✅ Security Monitoring Service initialized with Prometheus metrics');
  }

  async onModuleDestroy() {
    // Cleanup if needed
  }

  private initializeMetrics() {
    // Enable default Node.js metrics
    collectDefaultMetrics({ prefix: 'meqenet_' });

    // Security Events Counter
    this.securityEventsCounter = new Counter({
      name: 'meqenet_security_events_total',
      help: 'Total number of security events by type and severity',
      labelNames: ['type', 'severity', 'service'],
    });

    // Active Threats Gauge
    this.activeThreatsGauge = new Gauge({
      name: 'meqenet_active_threats',
      help: 'Number of currently active threat indicators',
      labelNames: ['type', 'severity'],
    });

    // Response Time Histogram
    this.responseTimeHistogram = new Histogram({
      name: 'meqenet_security_response_time_seconds',
      help: 'Security operation response times',
      labelNames: ['operation', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Failed Authentications Counter
    this.failedAuthenticationsCounter = new Counter({
      name: 'meqenet_failed_authentications_total',
      help: 'Total number of failed authentication attempts',
      labelNames: ['reason', 'ip_address', 'user_agent'],
    });

    // Rate Limit Hits Counter
    this.rateLimitHitsCounter = new Counter({
      name: 'meqenet_rate_limit_hits_total',
      help: 'Total number of rate limit hits',
      labelNames: ['endpoint', 'ip_address', 'user_id'],
    });

    // Encryption Operations Counter
    this.encryptionOperationsCounter = new Counter({
      name: 'meqenet_encryption_operations_total',
      help: 'Total number of encryption/decryption operations',
      labelNames: ['operation', 'status', 'algorithm'],
    });

    // Anomaly Detection Counter
    this.anomalyDetectionCounter = new Counter({
      name: 'meqenet_anomaly_detections_total',
      help: 'Total number of detected anomalies',
      labelNames: ['type', 'confidence', 'user_id'],
    });

    this.logger.log('📊 Prometheus metrics initialized successfully');
  }

  /**
   * Record a security event
   */
  async recordSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Store event for analysis
    this.securityEvents.push(fullEvent);

    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Update Prometheus metrics
    this.securityEventsCounter
      .labels(event.type, event.severity, 'auth-service')
      .inc();

    // Log the event
    this.logger.warn(
      `🔒 Security Event: ${event.type} (${event.severity}) - ${event.description}`,
      {
        userId: event.userId,
        ipAddress: event.ipAddress,
        correlationId: event.correlationId,
        metadata: event.metadata,
      }
    );

    // Trigger alerts for high/critical events
    if (event.severity === 'high' || event.severity === 'critical') {
      await this.triggerSecurityAlert(fullEvent);
    }
  }

  /**
   * Record failed authentication attempt
   */
  async recordFailedAuthentication(
    reason: string,
    ipAddress: string,
    userAgent: string,
    userId?: string
  ): Promise<void> {
    this.failedAuthenticationsCounter
      .labels(reason, ipAddress, userAgent)
      .inc();

    await this.recordSecurityEvent({
      type: 'authentication',
      severity: 'medium',
      userId,
      ipAddress,
      userAgent,
      description: `Failed authentication: ${reason}`,
      metadata: { reason },
    });

    // Check for potential brute force attack
    await this.detectBruteForce(ipAddress, userId);
  }

  /**
   * Record rate limit hit
   */
  async recordRateLimitHit(
    endpoint: string,
    ipAddress: string,
    userId?: string
  ): Promise<void> {
    this.rateLimitHitsCounter
      .labels(endpoint, ipAddress, userId || 'anonymous')
      .inc();

    await this.recordSecurityEvent({
      type: 'rate_limit',
      severity: 'low',
      userId,
      ipAddress,
      description: `Rate limit exceeded for endpoint: ${endpoint}`,
      metadata: { endpoint },
    });
  }

  /**
   * Record encryption/decryption operation
   */
  async recordEncryptionOperation(
    operation: 'encrypt' | 'decrypt',
    status: 'success' | 'failure',
    algorithm: string = 'AES-256-GCM',
    duration?: number
  ): Promise<void> {
    this.encryptionOperationsCounter
      .labels(operation, status, algorithm)
      .inc();

    if (duration !== undefined) {
      this.responseTimeHistogram
        .labels(`encryption_${operation}`, status)
        .observe(duration / 1000); // Convert to seconds
    }

    if (status === 'failure') {
      await this.recordSecurityEvent({
        type: operation === 'encrypt' ? 'encryption' : 'decryption',
        severity: 'high',
        description: `Encryption operation failed: ${operation}`,
        metadata: { algorithm, duration },
      });
    }
  }

  /**
   * Record anomaly detection
   */
  async recordAnomalyDetection(
    type: string,
    confidence: number,
    userId: string,
    indicators: string[]
  ): Promise<void> {
    this.anomalyDetectionCounter
      .labels(type, confidence.toString(), userId)
      .inc();

    const threatIndicator: ThreatIndicator = {
      type: type as ThreatIndicator['type'],
      confidence,
      userId,
      indicators,
      timestamp: new Date(),
    };

    // Store threat indicators for user
    if (!this.threatIndicators.has(userId)) {
      this.threatIndicators.set(userId, []);
    }
    this.threatIndicators.get(userId)!.push(threatIndicator);

    // Keep only last 50 indicators per user
    const userIndicators = this.threatIndicators.get(userId)!;
    if (userIndicators.length > 50) {
      this.threatIndicators.set(userId, userIndicators.slice(-50));
    }

    // Update active threats gauge
    this.activeThreatsGauge
      .labels(type, confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low')
      .inc();

    await this.recordSecurityEvent({
      type: 'anomaly',
      severity: confidence > 0.8 ? 'high' : 'medium',
      userId,
      description: `Anomaly detected: ${type} (confidence: ${(confidence * 100).toFixed(1)}%)`,
      metadata: { indicators, confidence },
    });
  }

  /**
   * Detect potential brute force attacks
   */
  private async detectBruteForce(ipAddress: string, userId?: string): Promise<void> {
    const recentFailures = this.securityEvents.filter(
      event =>
        event.type === 'authentication' &&
        event.ipAddress === ipAddress &&
        event.timestamp > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    if (recentFailures.length >= 5) {
      await this.recordSecurityEvent({
        type: 'threat_detection',
        severity: 'high',
        userId,
        ipAddress,
        description: `Potential brute force attack detected: ${recentFailures.length} failed attempts`,
        metadata: {
          failureCount: recentFailures.length,
          timeWindow: '15 minutes'
        },
      });
    }
  }

  /**
   * Trigger security alert for high-severity events
   */
  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, this would:
    // 1. Send alerts to security team via email/SMS/Slack
    // 2. Create incident tickets
    // 3. Update monitoring dashboards
    // 4. Potentially trigger automated responses

    this.logger.error(
      `🚨 SECURITY ALERT: ${event.type.toUpperCase()} (${event.severity.toUpperCase()})`,
      {
        description: event.description,
        userId: event.userId,
        ipAddress: event.ipAddress,
        correlationId: event.correlationId,
        metadata: event.metadata,
        timestamp: event.timestamp,
      }
    );

    // TODO: Implement actual alert mechanisms
    // await this.sendEmailAlert(event);
    // await this.sendSlackAlert(event);
    // await this.createIncidentTicket(event);
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  getSecurityMetrics(): {
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    activeThreats: number;
    recentEvents: SecurityEvent[];
    threatIndicators: Record<string, ThreatIndicator[]>;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    // Calculate metrics from recent events
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      eventsByType,
      eventsBySeverity,
      activeThreats: Array.from(this.threatIndicators.values()).flat().length,
      recentEvents: recentEvents.slice(-50), // Last 50 events
      threatIndicators: Object.fromEntries(this.threatIndicators),
    };
  }

  /**
   * Get Prometheus metrics endpoint
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  cleanupOldData(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Clean old security events
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > oneWeekAgo
    );

    // Clean old threat indicators
    for (const [userId, indicators] of this.threatIndicators) {
      const recentIndicators = indicators.filter(
        indicator => indicator.timestamp > oneWeekAgo
      );

      if (recentIndicators.length === 0) {
        this.threatIndicators.delete(userId);
      } else {
        this.threatIndicators.set(userId, recentIndicators);
      }
    }
  }
}
