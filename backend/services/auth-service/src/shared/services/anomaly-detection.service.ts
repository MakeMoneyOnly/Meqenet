import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SecurityMonitoringService, ThreatIndicator } from './security-monitoring.service';

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
    unusualHourThreshold: 0.7,  // 70% confidence for unusual hours
    newLocationThreshold: 0.8,   // 80% confidence for new locations
    newDeviceThreshold: 0.6,     // 60% confidence for new devices
    riskScoreThreshold: 75,      // Risk score above 75 triggers alerts
  };

  constructor(
    private configService: ConfigService,
    private securityMonitoringService: SecurityMonitoringService,
  ) {}

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
    const analysis = await this.performBehaviorAnalysis(profile, currentActivity);

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
        currentDevice: this.extractDeviceFromUserAgent(currentActivity.userAgent),
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
      averageRequestsPerHour: 10, // Default baseline
      averageSessionDuration: 30 * 60 * 1000, // 30 minutes
      commonEndpoints: ['/auth/login', '/auth/refresh'],
      commonTimeWindows: [9, 10, 11, 12, 13, 14, 15, 16, 17], // Business hours
      geolocations: [],
      devices: [],
      lastActivity: new Date(),
      trustScore: 50, // Neutral starting score
      anomalyCount: 0,
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
        requestRateDeviation: await this.calculateRequestRateDeviation(profile.userId),
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
    const recentRequests = Math.floor(Math.random() * 20); // 0-20 requests in last hour
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
    if (analysis.deviations.requestRateDeviation > this.thresholds.requestRateMultiplier) {
      anomalies.push({
        isAnomaly: true,
        confidence: Math.min(0.9, analysis.deviations.requestRateDeviation / 5),
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
      riskScore += Math.min(30, (analysis.deviations.requestRateDeviation - 1) * 10);
    }

    // Additional risk from anomalies
    for (const anomaly of anomalies) {
      if (anomaly.isAnomaly) {
        switch (anomaly.recommendedAction) {
          case 'block':
            riskScore += 40;
            break;
          case 'alert':
            riskScore += 25;
            break;
          case 'investigate':
            riskScore += 20;
            break;
          case 'monitor':
            riskScore += 10;
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
      if (profile.commonEndpoints.length > 10) {
        profile.commonEndpoints = profile.commonEndpoints.slice(-10);
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

    if (firstOctet >= 1 && firstOctet <= 126) {
      return 'us-east';
    } else if (firstOctet >= 128 && firstOctet <= 191) {
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

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
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
    return this.userProfiles.get(userId) || null;
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
      .filter(profile => profile.trustScore < 30 || profile.anomalyCount > 5)
      .sort((a, b) => a.trustScore - b.trustScore);
  }
}
