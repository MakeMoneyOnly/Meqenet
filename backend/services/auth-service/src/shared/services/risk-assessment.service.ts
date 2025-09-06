import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { SecurityMonitoringService } from './security-monitoring.service';

export interface RiskFactors {
  userId: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  deviceFingerprint?: string;
  loginTime: Date;
  previousLoginTime?: Date;
  previousLoginLocation?: string;
  failedAttemptsCount: number;
  accountAge?: number;
  unusualPatterns: boolean;
}

export interface RiskAssessment {
  score: number; // 0-100 scale
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  requiresMfa: boolean;
  requiresStepUp: boolean;
  recommendedActions: string[];
}

export interface GeoLocation {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

@Injectable()
export class RiskAssessmentService {
  private readonly logger = new Logger(RiskAssessmentService.name);

  // Risk thresholds
  // eslint-disable-next-line no-magic-numbers
  private readonly LOW_RISK_THRESHOLD = 25;
  // eslint-disable-next-line no-magic-numbers
  private readonly MEDIUM_RISK_THRESHOLD = 50;
  // eslint-disable-next-line no-magic-numbers
  private readonly HIGH_RISK_THRESHOLD = 75;

  // Time constants
  // eslint-disable-next-line no-magic-numbers
  private readonly MILLISECONDS_PER_SECOND = 1000;
  // eslint-disable-next-line no-magic-numbers
  private readonly SECONDS_PER_MINUTE = 60;
  // eslint-disable-next-line no-magic-numbers
  private readonly MINUTES_PER_HOUR = 60;
  // eslint-disable-next-line no-magic-numbers
  private readonly HOURS_PER_DAY = 24;
  // eslint-disable-next-line no-magic-numbers
  private readonly FAILED_ATTEMPTS_DIVISOR = 5;

  // Risk weights
  private readonly RISK_WEIGHTS = {
    NEW_DEVICE: 15,
    UNUSUAL_LOCATION: 25,
    SUSPICIOUS_TIME: 10,
    FAILED_ATTEMPTS: 20,
    ACCOUNT_AGE: 5,
    IP_REPUTATION: 15,
    USER_AGENT_ANOMALY: 10,
  };

  // Known suspicious patterns
  private readonly SUSPICIOUS_USER_AGENTS = [
    'curl',
    'wget',
    'python-requests',
    'postman',
    'insomnia',
  ];

  private readonly SUSPICIOUS_TIMES = {
    start: 2, // 2 AM
    end: 6, // 6 AM
  };

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => SecurityMonitoringService))
    private securityMonitoring: SecurityMonitoringService
  ) {}

  /**
   * Assess risk for a login attempt
   */
  async assessRisk(riskFactors: RiskFactors): Promise<RiskAssessment> {
    const factors: string[] = [];
    let totalScore = 0;

    // Factor 1: Device fingerprint analysis
    const deviceRisk = await this.assessDeviceRisk(riskFactors);
    totalScore += deviceRisk.score;
    if (deviceRisk.score > 0) {
      factors.push(deviceRisk.factor);
    }

    // Factor 2: Location analysis
    const locationRisk = await this.assessLocationRisk(riskFactors);
    totalScore += locationRisk.score;
    if (locationRisk.score > 0) {
      factors.push(locationRisk.factor);
    }

    // Factor 3: Time-based analysis
    const timeRisk = this.assessTimeRisk(riskFactors);
    totalScore += timeRisk.score;
    if (timeRisk.score > 0) {
      factors.push(timeRisk.factor);
    }

    // Factor 4: Failed attempts analysis
    const attemptRisk = this.assessAttemptRisk(riskFactors);
    totalScore += attemptRisk.score;
    if (attemptRisk.score > 0) {
      factors.push(attemptRisk.factor);
    }

    // Factor 5: Account age analysis
    const accountRisk = this.assessAccountRisk(riskFactors);
    totalScore += accountRisk.score;
    if (accountRisk.score > 0) {
      factors.push(accountRisk.factor);
    }

    // Factor 6: IP reputation
    const ipRisk = await this.assessIpRisk(riskFactors);
    totalScore += ipRisk.score;
    if (ipRisk.score > 0) {
      factors.push(ipRisk.factor);
    }

    // Factor 7: User agent analysis
    const uaRisk = this.assessUserAgentRisk(riskFactors);
    totalScore += uaRisk.score;
    if (uaRisk.score > 0) {
      factors.push(uaRisk.factor);
    }

    // Determine risk level
    const level = this.determineRiskLevel(totalScore);

    // Determine required actions
    const requiresMfa = totalScore >= this.MEDIUM_RISK_THRESHOLD;
    const requiresStepUp = totalScore >= this.HIGH_RISK_THRESHOLD;

    const recommendedActions = this.generateRecommendedActions(
      level,
      factors,
      requiresMfa,
      requiresStepUp
    );

    const assessment: RiskAssessment = {
      score: Math.min(totalScore, 100),
      level,
      factors,
      requiresMfa,
      requiresStepUp,
      recommendedActions,
    };

    // Log high-risk assessments
    if (level === 'HIGH' || level === 'CRITICAL') {
      await this.securityMonitoring.recordAnomalyDetection(
        'high_risk_login',
        totalScore / 100,
        riskFactors.userId,
        factors
      );
    }

    this.logger.debug(
      `Risk assessment for user ${riskFactors.userId}: score=${assessment.score}, level=${assessment.level}`
    );

    return assessment;
  }

  /**
   * Assess device fingerprint risk
   */
  private async assessDeviceRisk(riskFactors: RiskFactors): Promise<{
    score: number;
    factor: string;
  }> {
    if (!riskFactors.deviceFingerprint) {
      return { score: 0, factor: '' };
    }

    // Check if this is a new device fingerprint
    const isNewDevice = await this.isNewDevice(
      riskFactors.userId,
      riskFactors.deviceFingerprint
    );

    if (isNewDevice) {
      return {
        score: this.RISK_WEIGHTS.NEW_DEVICE,
        factor: 'New device detected',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess location risk
   */
  private async assessLocationRisk(riskFactors: RiskFactors): Promise<{
    score: number;
    factor: string;
  }> {
    if (!riskFactors.location || !riskFactors.previousLoginLocation) {
      return { score: 0, factor: '' };
    }

    // Simple distance-based analysis (in production, use geolocation service)
    const isUnusualLocation = await this.isUnusualLocation(
      riskFactors.location,
      riskFactors.previousLoginLocation
    );

    if (isUnusualLocation) {
      return {
        score: this.RISK_WEIGHTS.UNUSUAL_LOCATION,
        factor: 'Unusual location detected',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess time-based risk
   */
  private assessTimeRisk(riskFactors: RiskFactors): {
    score: number;
    factor: string;
  } {
    const hour = riskFactors.loginTime.getHours();

    // Check if login is during suspicious hours
    const isSuspiciousTime =
      hour >= this.SUSPICIOUS_TIMES.start && hour <= this.SUSPICIOUS_TIMES.end;

    if (isSuspiciousTime) {
      return {
        score: this.RISK_WEIGHTS.SUSPICIOUS_TIME,
        factor: 'Login during unusual hours',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess failed attempts risk
   */
  private assessAttemptRisk(riskFactors: RiskFactors): {
    score: number;
    factor: string;
  } {
    const { failedAttemptsCount } = riskFactors;

    if (failedAttemptsCount > 0) {
      const score = Math.min(
        failedAttemptsCount *
          (this.RISK_WEIGHTS.FAILED_ATTEMPTS / this.FAILED_ATTEMPTS_DIVISOR),
        this.RISK_WEIGHTS.FAILED_ATTEMPTS
      );

      return {
        score,
        factor: `${failedAttemptsCount} recent failed attempts`,
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess account age risk
   */
  private assessAccountRisk(riskFactors: RiskFactors): {
    score: number;
    factor: string;
  } {
    if (!riskFactors.accountAge) {
      return { score: 0, factor: '' };
    }

    // New accounts (< 24 hours) have higher risk
    const hoursOld =
      riskFactors.accountAge /
      (this.MILLISECONDS_PER_SECOND *
        this.SECONDS_PER_MINUTE *
        this.MINUTES_PER_HOUR);

    if (hoursOld < this.HOURS_PER_DAY) {
      return {
        score: this.RISK_WEIGHTS.ACCOUNT_AGE,
        factor: 'New account login',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess IP reputation risk
   */
  private async assessIpRisk(riskFactors: RiskFactors): Promise<{
    score: number;
    factor: string;
  }> {
    // In production, integrate with IP reputation services like MaxMind, etc.
    // For now, use simple heuristics

    const isPrivateIp = this.isPrivateIp(riskFactors.ipAddress);
    const isSuspiciousRange = this.isSuspiciousIpRange(riskFactors.ipAddress);

    if (isSuspiciousRange || !isPrivateIp) {
      return {
        score: this.RISK_WEIGHTS.IP_REPUTATION,
        factor: 'Suspicious IP address',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Assess user agent risk
   */
  private assessUserAgentRisk(riskFactors: RiskFactors): {
    score: number;
    factor: string;
  } {
    if (!riskFactors.userAgent) {
      return { score: 0, factor: '' };
    }

    const userAgent = riskFactors.userAgent.toLowerCase();
    const isSuspicious = this.SUSPICIOUS_USER_AGENTS.some(suspicious =>
      userAgent.includes(suspicious.toLowerCase())
    );

    if (isSuspicious) {
      return {
        score: this.RISK_WEIGHTS.USER_AGENT_ANOMALY,
        factor: 'Automated tool detected',
      };
    }

    return { score: 0, factor: '' };
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(
    score: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= this.HIGH_RISK_THRESHOLD) return 'CRITICAL';
    if (score >= this.MEDIUM_RISK_THRESHOLD) return 'HIGH';
    if (score >= this.LOW_RISK_THRESHOLD) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommended actions based on risk assessment
   */
  private generateRecommendedActions(
    level: string,
    _factors: string[],
    _requiresMfa: boolean,
    _requiresStepUp: boolean
  ): string[] {
    const actions: string[] = [];

    switch (level) {
      case 'CRITICAL':
        actions.push('Block login attempt');
        actions.push('Send security alert to user');
        actions.push('Require account verification');
        break;
      case 'HIGH':
        actions.push('Require MFA verification');
        actions.push('Send security notification');
        actions.push('Log additional security context');
        break;
      case 'MEDIUM':
        if (_requiresMfa) {
          actions.push('Prompt for MFA if not recently verified');
        }
        actions.push('Send login notification');
        actions.push('Monitor session activity');
        break;
      case 'LOW':
      default:
        actions.push('Allow login');
        break;
    }

    return actions;
  }

  /**
   * Check if device fingerprint is new for user
   */
  private async isNewDevice(
    userId: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    // In production, check against user's known devices
    // For now, use a simple hash-based approach
    const deviceHash = crypto
      .createHash('sha256')
      .update(`${userId}:${deviceFingerprint}`)
      .digest('hex');

    // This would typically query a database
    // For demo purposes, we'll assume new devices are suspicious
    return deviceHash.endsWith('1') || deviceHash.endsWith('2');
  }

  /**
   * Check if location is unusual
   */
  private async isUnusualLocation(
    currentLocation: string,
    previousLocation: string
  ): Promise<boolean> {
    // Simple string comparison - in production, use geolocation services
    return currentLocation !== previousLocation;
  }

  /**
   * Check if IP is private
   */
  private isPrivateIp(ip: string): boolean {
    // Check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Check if IP range is suspicious
   */
  private isSuspiciousIpRange(ip: string): boolean {
    // Check for known suspicious ranges (TOR exit nodes, etc.)
    // This is a simplified check - in production, use IP reputation databases
    const suspiciousRanges = [
      /^185\.220\./, // Example TOR range
      /^185\.100\./, // Example suspicious range
    ];

    return suspiciousRanges.some(range => range.test(ip));
  }

  /**
   * Get risk assessment statistics
   */
  getRiskStats(): {
    thresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    weights: Record<string, number>;
  } {
    return {
      thresholds: {
        low: this.LOW_RISK_THRESHOLD,
        medium: this.MEDIUM_RISK_THRESHOLD,
        high: this.HIGH_RISK_THRESHOLD,
        critical: this.HIGH_RISK_THRESHOLD,
      },
      weights: this.RISK_WEIGHTS,
    };
  }
}
