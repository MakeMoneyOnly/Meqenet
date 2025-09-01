import { Injectable, Logger } from '@nestjs/common';

import { SecurityMonitoringService } from './security-monitoring.service';

// Constants for magic numbers
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

// Simulation constants
const MAX_SIMULATED_REQUESTS = 20;

// Anomaly confidence constants
const MAX_ANOMALY_CONFIDENCE = 0.9;
const ANOMALY_CONFIDENCE_DIVISOR = 5;

// Risk scoring constants
const MAX_REQUEST_RATE_RISK_SCORE = 30;
const REQUEST_RATE_RISK_MULTIPLIER = 10;

// Anomaly action risk scores
const BLOCK_ACTION_RISK_SCORE = 40;
const ALERT_ACTION_RISK_SCORE = 25;
const INVESTIGATE_ACTION_RISK_SCORE = 20;
const MONITOR_ACTION_RISK_SCORE = 10;

// Session and profile constants
const DEFAULT_REQUESTS_PER_HOUR = 10;
const DEFAULT_SESSION_DURATION_MINUTES = 30;
const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;

// Profile limits
const MAX_COMMON_ENDPOINTS = 10;
const MAX_COMMON_ENDPOINTS_SLICE = -10;

// High risk user thresholds
const HIGH_RISK_TRUST_SCORE_THRESHOLD = 30;
const HIGH_RISK_ANOMALY_COUNT_THRESHOLD = 5;

// IP address range constants
const IP_CLASS_A_MIN = 1;
const IP_CLASS_A_MAX = 126;
const IP_CLASS_B_MIN = 128;
const IP_CLASS_B_MAX = 191;

// Trust and anomaly constants
const NEUTRAL_TRUST_SCORE = 50;
const INITIAL_ANOMALY_COUNT = 0;

export interface UserBehaviorProfile {
  userId: string;
  averageRequestsPerHour: number;
  averageSessionDuration: number;
  commonEndpoints: string[];
  commonTimeWindows: number[]; // Hours of day (0-23)
  geolocations: string[];
  devices: string[];
  lastActivity: Date;
  trustScore: number; // 0-100 scale
  anomalyCount: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  anomalyType: string;
  description: string;
  recommendedAction: 'monitor' | 'alert' | 'block' | 'investigate';
  metadata: Record<string, unknown>;
}

export interface BehaviorAnalysis {
  userId: string;
  currentBehavior: {
    requestsInLastHour: number;
    currentSessionDuration: number;
    currentEndpoint: string;
    currentTime: number;
    currentLocation: string;
    currentDevice: string;
  };
  deviations: {
    requestRateDeviation: number;
    timeWindowDeviation: boolean;
    locationDeviation: boolean;
    deviceDeviation: boolean;
    endpointDeviation: boolean;
  };
  riskScore: number;
  anomalies: AnomalyDetectionResult[];
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);

  // In-memory storage for user behavior profiles
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();

  // Anomaly detection thresholds
  private readonly thresholds = {
    requestRateMultiplier: 3.0, // 3x normal rate
    unusualHourThreshold: 0.7, // 70% confidence for unusual hours
    newLocationThreshold: 0.8, // 80% confidence for new locations
    newDeviceThreshold: 0.6, // 60% confidence for new devices
    riskScoreThreshold: 75, // Risk score above 75 triggers alerts
  };

  constructor(private securityMonitoringService: SecurityMonitoringService) {}

  /**
   * Analyze user behavior for anomalies
   */
  async analyzeBehavior(
    userId: string,
    currentActivity: {
      endpoint: string;
      method: string;
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
      sessionStart?: Date;
    }
  ): Promise<BehaviorAnalysis> {
    // Get or create user profile
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = this.createInitialProfile(userId);
      this.userProfiles.set(userId, profile);
    }

    // Analyze current behavior against profile
    const analysis = await this.performBehaviorAnalysis(
      profile,
      currentActivity
    );

    // Update user profile with new activity
    this.updateUserProfile(profile, currentActivity);

    // Check for anomalies
    const anomalies = this.detectAnomalies(analysis);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(analysis, anomalies);

    // Update profile risk score
    profile.trustScore = Math.max(0, Math.min(100, 100 - riskScore));

    // Record anomalies in security monitoring
    for (const anomaly of anomalies) {
      if (anomaly.isAnomaly) {
        await this.securityMonitoringService.recordAnomalyDetection(
          anomaly.anomalyType,
          anomaly.confidence,
          userId,
          [anomaly.description]
        );
      }
    }

    return {
      userId,
      currentBehavior: {
        requestsInLastHour: analysis.deviations.requestRateDeviation,
        currentSessionDuration: currentActivity.sessionStart
          ? Date.now() - currentActivity.sessionStart.getTime()
          : 0,
        currentEndpoint: currentActivity.endpoint,
        currentTime: currentActivity.timestamp.getHours(),
        currentLocation: this.extractLocationFromIP(currentActivity.ipAddress),
        currentDevice: this.extractDeviceFromUserAgent(
          currentActivity.userAgent
        ),
      },
      deviations: analysis.deviations,
      riskScore,
      anomalies,
    };
  }

  /**
   * Create initial behavior profile for new users
   */
  private createInitialProfile(userId: string): UserBehaviorProfile {
    return {
      userId,
      averageRequestsPerHour: DEFAULT_REQUESTS_PER_HOUR, // Default baseline
      averageSessionDuration:
        DEFAULT_SESSION_DURATION_MINUTES *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND, // 30 minutes
      commonEndpoints: ['/auth/login', '/auth/refresh'],
      commonTimeWindows: Array.from(
        { length: BUSINESS_HOURS_END - BUSINESS_HOURS_START + 1 },
        (_, i) => BUSINESS_HOURS_START + i
      ), // Business hours
      geolocations: [],
      devices: [],
      lastActivity: new Date(),
      trustScore: NEUTRAL_TRUST_SCORE, // Neutral starting score
      anomalyCount: INITIAL_ANOMALY_COUNT,
    };
  }

  /**
   * Perform comprehensive behavior analysis
   */
  private async performBehaviorAnalysis(
    profile: UserBehaviorProfile,
    activity: {
      endpoint: string;
      method: string;
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
      sessionStart?: Date;
    }
  ): Promise<{
    deviations: {
      requestRateDeviation: number;
      timeWindowDeviation: boolean;
      locationDeviation: boolean;
      deviceDeviation: boolean;
      endpointDeviation: boolean;
    };
  }> {
    const currentHour = activity.timestamp.getHours();
    const currentLocation = this.extractLocationFromIP(activity.ipAddress);
    const currentDevice = this.extractDeviceFromUserAgent(activity.userAgent);

    return {
      deviations: {
        requestRateDeviation: await this.calculateRequestRateDeviation(
          profile.userId
        ),
        timeWindowDeviation: !profile.commonTimeWindows.includes(currentHour),
        locationDeviation: !profile.geolocations.includes(currentLocation),
        deviceDeviation: !profile.devices.includes(currentDevice),
        endpointDeviation: !profile.commonEndpoints.includes(activity.endpoint),
      },
    };
  }

  /**
   * Calculate deviation from normal request rate
   */
  private async calculateRequestRateDeviation(userId: string): Promise<number> {
    // This would typically query recent request logs
    // For now, return a simulated value
    const recentRequests = Math.floor(Math.random() * MAX_SIMULATED_REQUESTS); // 0-20 requests in last hour
    const profile = this.userProfiles.get(userId);

    if (!profile) return 1.0; // Normal

    const expectedRequests = profile.averageRequestsPerHour;
    return recentRequests / Math.max(expectedRequests, 1);
  }

  /**
   * Detect anomalies based on behavior analysis
   */
  private detectAnomalies(analysis: {
    deviations: {
      requestRateDeviation: number;
      timeWindowDeviation: boolean;
      locationDeviation: boolean;
      deviceDeviation: boolean;
      endpointDeviation: boolean;
    };
  }): AnomalyDetectionResult[] {
    const anomalies: AnomalyDetectionResult[] = [];

    // High request rate anomaly
    if (
      analysis.deviations.requestRateDeviation >
      this.thresholds.requestRateMultiplier
    ) {
      anomalies.push({
        isAnomaly: true,
        confidence: Math.min(
          MAX_ANOMALY_CONFIDENCE,
          analysis.deviations.requestRateDeviation / ANOMALY_CONFIDENCE_DIVISOR
        ),
        anomalyType: 'high_request_rate',
        description: `Request rate is ${(analysis.deviations.requestRateDeviation * 100).toFixed(0)}% above normal`,
        recommendedAction: 'alert',
        metadata: {
          deviation: analysis.deviations.requestRateDeviation,
          threshold: this.thresholds.requestRateMultiplier,
        },
      });
    }

    // Unusual time window anomaly
    if (analysis.deviations.timeWindowDeviation) {
      anomalies.push({
        isAnomaly: true,
        confidence: this.thresholds.unusualHourThreshold,
        anomalyType: 'unusual_time',
        description: 'Activity detected outside normal time windows',
        recommendedAction: 'monitor',
        metadata: { unusualHour: true },
      });
    }

    // New location anomaly
    if (analysis.deviations.locationDeviation) {
      anomalies.push({
        isAnomaly: true,
        confidence: this.thresholds.newLocationThreshold,
        anomalyType: 'new_location',
        description: 'Activity from previously unseen location',
        recommendedAction: 'investigate',
        metadata: { newLocation: true },
      });
    }

    // New device anomaly
    if (analysis.deviations.deviceDeviation) {
      anomalies.push({
        isAnomaly: true,
        confidence: this.thresholds.newDeviceThreshold,
        anomalyType: 'new_device',
        description: 'Activity from previously unseen device',
        recommendedAction: 'monitor',
        metadata: { newDevice: true },
      });
    }

    // Unusual endpoint anomaly
    if (analysis.deviations.endpointDeviation) {
      anomalies.push({
        isAnomaly: true,
        confidence: 0.5,
        anomalyType: 'unusual_endpoint',
        description: 'Access to unusual endpoint',
        recommendedAction: 'monitor',
        metadata: { unusualEndpoint: true },
      });
    }

    return anomalies;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    analysis: {
      deviations: {
        requestRateDeviation: number;
        timeWindowDeviation: boolean;
        locationDeviation: boolean;
        deviceDeviation: boolean;
        endpointDeviation: boolean;
      };
    },
    anomalies: AnomalyDetectionResult[]
  ): number {
    let riskScore = 0;

    // Base risk from request rate
    if (analysis.deviations.requestRateDeviation > 1) {
      riskScore += Math.min(
        MAX_REQUEST_RATE_RISK_SCORE,
        (analysis.deviations.requestRateDeviation - 1) *
          REQUEST_RATE_RISK_MULTIPLIER
      );
    }

    // Additional risk from anomalies
    for (const anomaly of anomalies) {
      if (anomaly.isAnomaly) {
        switch (anomaly.recommendedAction) {
          case 'block':
            riskScore += BLOCK_ACTION_RISK_SCORE;
            break;
          case 'alert':
            riskScore += ALERT_ACTION_RISK_SCORE;
            break;
          case 'investigate':
            riskScore += INVESTIGATE_ACTION_RISK_SCORE;
            break;
          case 'monitor':
            riskScore += MONITOR_ACTION_RISK_SCORE;
            break;
        }
      }
    }

    // Cap at 100
    return Math.min(100, riskScore);
  }

  /**
   * Update user profile with new activity
   */
  private updateUserProfile(
    profile: UserBehaviorProfile,
    activity: {
      endpoint: string;
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
    }
  ): void {
    const location = this.extractLocationFromIP(activity.ipAddress);
    const device = this.extractDeviceFromUserAgent(activity.userAgent);

    // Update common endpoints
    if (!profile.commonEndpoints.includes(activity.endpoint)) {
      profile.commonEndpoints.push(activity.endpoint);
      // Keep only top 10 most common
      if (profile.commonEndpoints.length > MAX_COMMON_ENDPOINTS) {
        profile.commonEndpoints = profile.commonEndpoints.slice(
          MAX_COMMON_ENDPOINTS_SLICE
        );
      }
    }

    // Update geolocations
    if (!profile.geolocations.includes(location)) {
      profile.geolocations.push(location);
    }

    // Update devices
    if (!profile.devices.includes(device)) {
      profile.devices.push(device);
    }

    // Update time windows
    const hour = activity.timestamp.getHours();
    if (!profile.commonTimeWindows.includes(hour)) {
      profile.commonTimeWindows.push(hour);
    }

    profile.lastActivity = activity.timestamp;
  }

  /**
   * Extract location information from IP address
   */
  private extractLocationFromIP(ipAddress: string): string {
    // This would typically use a GeoIP database
    // For now, return a simulated location
    if (ipAddress.startsWith('192.168.') || ipAddress === '127.0.0.1') {
      return 'local';
    }

    // Simulate different regions based on IP
    const ipParts = ipAddress.split('.');
    const firstOctet = parseInt(ipParts[0]);

    if (firstOctet >= IP_CLASS_A_MIN && firstOctet <= IP_CLASS_A_MAX) {
      return 'us-east';
    } else if (firstOctet >= IP_CLASS_B_MIN && firstOctet <= IP_CLASS_B_MAX) {
      return 'us-west';
    } else {
      return 'unknown';
    }
  }

  /**
   * Extract device information from User-Agent
   */
  private extractDeviceFromUserAgent(userAgent: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();

    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else if (ua.includes('windows')) {
      return 'windows-desktop';
    } else if (ua.includes('mac')) {
      return 'mac-desktop';
    } else if (ua.includes('linux')) {
      return 'linux-desktop';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get user behavior profile
   */
  getUserProfile(userId: string): UserBehaviorProfile | null {
    return this.userProfiles.get(userId) ?? null;
  }

  /**
   * Get all user profiles (for monitoring)
   */
  getAllProfiles(): UserBehaviorProfile[] {
    return Array.from(this.userProfiles.values());
  }

  /**
   * Reset user profile (for testing or manual intervention)
   */
  resetUserProfile(userId: string): boolean {
    if (this.userProfiles.has(userId)) {
      this.userProfiles.delete(userId);
      this.logger.log(`🔄 Reset behavior profile for user: ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Get high-risk users
   */
  getHighRiskUsers(): UserBehaviorProfile[] {
    return Array.from(this.userProfiles.values())
      .filter(
        profile =>
          profile.trustScore < HIGH_RISK_TRUST_SCORE_THRESHOLD ||
          profile.anomalyCount > HIGH_RISK_ANOMALY_COUNT_THRESHOLD
      )
      .sort((a, b) => a.trustScore - b.trustScore);
  }
}
