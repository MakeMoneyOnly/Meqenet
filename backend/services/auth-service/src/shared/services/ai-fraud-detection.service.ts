import { Injectable, Logger } from '@nestjs/common';

import { SecurityMonitoringService } from './security-monitoring.service';

// Constants for magic numbers
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

const FRAUD_TIME_WINDOW_HOURS = 2;
const HIGH_RISK_SCORE = 75;
const CRITICAL_RISK_SCORE = 90;
const UNUSUAL_AMOUNT_MULTIPLIER = 3.0;
const UNUSUAL_LOCATION_THRESHOLD = 0.8;
const HIGH_VELOCITY_MULTIPLIER = 5.0;

const HIGH_RISK_COUNTRY_SCORE = 90;
const UNUSUAL_LOCATION_SCORE = 70;
const UNUSUAL_HOUR_SCORE = 40;
const RAPID_SUCCESSION_SCORE = 60;
const UNKNOWN_DEVICE_SCORE = 65;
const SUSPICIOUS_MERCHANT_SCORE = 85;
const UNUSUAL_MERCHANT_SCORE = 45;
const RAPID_SUCCESSION_THRESHOLD_SECONDS = 5 * SECONDS_PER_MINUTE; // 5 minutes in seconds

const _MAX_SCORE = 100;
const _AMOUNT_DEVIATION_MULTIPLIER = 20;
const _HIGH_RISK_AMOUNT_SCORE = 80;
const _EARLY_HOUR_THRESHOLD = 6;
const _LATE_HOUR_THRESHOLD = 22;

const HIGH_RISK_AMOUNT_1 = 10000;
const HIGH_RISK_AMOUNT_2 = 50000;
const HIGH_RISK_AMOUNT_3 = 100000;

const MAX_COMMON_LOCATIONS = 10;
const MAX_COMMON_MERCHANTS = 10;
const MAX_COMMON_DEVICES = 5;
const RISK_SCORE_INCREMENT = 10;
const RISK_SCORE_DECREMENT = 1;

const CRITICAL_RISK_THRESHOLD = 90;
const HIGH_RISK_THRESHOLD = 75;
const MEDIUM_RISK_THRESHOLD = 50;
const REVIEW_RISK_THRESHOLD = 60;
const MIN_REASONS_FOR_BLOCK = 2;

const BASE_CONFIDENCE = 0.5;
const HIGH_CONFIDENCE_TRANSACTION_THRESHOLD = 10;
const MEDIUM_CONFIDENCE_TRANSACTION_THRESHOLD = 5;
const HIGH_CONFIDENCE_INCREMENT = 0.2;
const MEDIUM_CONFIDENCE_INCREMENT = 0.1;
const COMPLETE_DATA_CONFIDENCE_INCREMENT = 0.2;
const NEW_USER_TRANSACTION_THRESHOLD = 3;
const NEW_USER_CONFIDENCE_PENALTY = 0.3;
const MIN_CONFIDENCE = 0.1;
const MAX_CONFIDENCE = 1.0;

// Risk analysis weights
const AMOUNT_ANOMALY_WEIGHT = 0.25;
const LOCATION_ANOMALY_WEIGHT = 0.2;
const TIME_PATTERN_ANOMALY_WEIGHT = 0.15;
const DEVICE_ANOMALY_WEIGHT = 0.15;
const MERCHANT_ANOMALY_WEIGHT = 0.1;
const VELOCITY_ANOMALY_WEIGHT = 0.15;

// Velocity analysis constants
const VELOCITY_TIME_WINDOW_MINUTES = 60; // 1 hour
const CURRENT_TRANSACTION_COUNT = 1;
const VELOCITY_RATIO_MULTIPLIER = 15;

export interface TransactionData {
  userId: string;
  amount: number;
  currency: string;
  merchantId?: string;
  merchantCategory?: string;
  location: {
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: Date;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent: string;
  paymentMethod: string;
  previousTransactions?: TransactionData[];
}

export interface FraudScore {
  overall: number; // 0-100 scale
  components: {
    amountAnomaly: number;
    locationAnomaly: number;
    timePatternAnomaly: number;
    deviceAnomaly: number;
    merchantAnomaly: number;
    velocityAnomaly: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  confidence: number; // 0-1 scale
  recommendedAction: 'approve' | 'review' | 'block' | 'investigate';
}

export interface UserProfile {
  userId: string;
  averageTransactionAmount: number;
  transactionFrequency: number;
  commonLocations: string[];
  commonMerchants: string[];
  commonDevices: string[];
  riskScore: number;
  lastActivity: Date;
  totalTransactions: number;
  fraudulentTransactions: number;
}

@Injectable()
export class AIFraudDetectionService {
  private readonly logger = new Logger(AIFraudDetectionService.name);

  // User profiles for behavioral analysis
  private userProfiles: Map<string, UserProfile> = new Map();

  // Fraud detection thresholds
  private readonly thresholds = {
    highRiskScore: HIGH_RISK_SCORE,
    criticalRiskScore: CRITICAL_RISK_SCORE,
    unusualAmountMultiplier: UNUSUAL_AMOUNT_MULTIPLIER,
    unusualLocationThreshold: UNUSUAL_LOCATION_THRESHOLD,
    highVelocityMultiplier: HIGH_VELOCITY_MULTIPLIER,
    suspiciousTimeWindow:
      FRAUD_TIME_WINDOW_HOURS *
      MINUTES_PER_HOUR *
      SECONDS_PER_MINUTE *
      MILLISECONDS_PER_SECOND,
  };

  // Known fraudulent patterns
  private readonly fraudPatterns = {
    highAmountLocations: ['North Korea', 'Iran', 'Syria', 'Cuba'],
    suspiciousMerchants: ['crypto', 'gambling', 'darkweb'],
    highRiskAmounts: [
      HIGH_RISK_AMOUNT_1,
      HIGH_RISK_AMOUNT_2,
      HIGH_RISK_AMOUNT_3,
    ], // Threshold amounts
  };

  constructor(
    private securityMonitoringService: SecurityMonitoringService
  ) {
    this.initializeFraudDetection();
  }

  private initializeFraudDetection(): void {
    this.logger.log('🧠 AI Fraud Detection Service initialized');
    // In a real implementation, this would load ML models
  }

  /**
   * Analyze transaction for fraud
   */
  async analyzeTransaction(transaction: TransactionData): Promise<FraudScore> {
    try {
      // Get or create user profile
      const userProfile = this.getOrCreateUserProfile(transaction.userId);

      // Perform multi-layered fraud analysis
      const amountAnomaly = this.analyzeAmountAnomaly(transaction, userProfile);
      const locationAnomaly = this.analyzeLocationAnomaly(
        transaction,
        userProfile
      );
      const timePatternAnomaly = this.analyzeTimePatternAnomaly(
        transaction,
        userProfile
      );
      const deviceAnomaly = this.analyzeDeviceAnomaly(transaction, userProfile);
      const merchantAnomaly = this.analyzeMerchantAnomaly(
        transaction,
        userProfile
      );
      const velocityAnomaly = this.analyzeVelocityAnomaly(
        transaction,
        userProfile
      );

      // Calculate component scores
      const components = {
        amountAnomaly: amountAnomaly.score,
        locationAnomaly: locationAnomaly.score,
        timePatternAnomaly: timePatternAnomaly.score,
        deviceAnomaly: deviceAnomaly.score,
        merchantAnomaly: merchantAnomaly.score,
        velocityAnomaly: velocityAnomaly.score,
      };

      // Calculate overall fraud score using weighted average
      const weights = {
        amountAnomaly: AMOUNT_ANOMALY_WEIGHT,
        locationAnomaly: LOCATION_ANOMALY_WEIGHT,
        timePatternAnomaly: TIME_PATTERN_ANOMALY_WEIGHT,
        deviceAnomaly: DEVICE_ANOMALY_WEIGHT,
        merchantAnomaly: MERCHANT_ANOMALY_WEIGHT,
        velocityAnomaly: VELOCITY_ANOMALY_WEIGHT,
      };

      const overallScore = Object.entries(components).reduce(
        (sum, [key, score]) =>
          sum + score * weights[key as keyof typeof weights],
        0
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore);

      // Compile reasons
      const reasons = [
        ...amountAnomaly.reasons,
        ...locationAnomaly.reasons,
        ...timePatternAnomaly.reasons,
        ...deviceAnomaly.reasons,
        ...merchantAnomaly.reasons,
        ...velocityAnomaly.reasons,
      ].filter(Boolean);

      // Determine recommended action
      const recommendedAction = this.determineRecommendedAction(
        overallScore,
        reasons
      );

      // Calculate confidence based on data quality and consistency
      const confidence = this.calculateConfidence(transaction, userProfile);

      const fraudScore: FraudScore = {
        overall: overallScore,
        components,
        riskLevel,
        reasons,
        confidence,
        recommendedAction,
      };

      // Update user profile
      this.updateUserProfile(userProfile, transaction, fraudScore);

      // Log high-risk transactions
      if (overallScore >= this.thresholds.highRiskScore) {
        await this.securityMonitoringService.recordSecurityEvent({
          type: 'threat_detection',
          severity:
            overallScore >= this.thresholds.criticalRiskScore
              ? 'critical'
              : 'high',
          userId: transaction.userId,
          ipAddress: transaction.ipAddress,
          description: `High-risk transaction detected: ${transaction.amount} ${transaction.currency}`,
          metadata: {
            fraudScore: overallScore,
            riskLevel,
            reasons,
            transactionId: `txn_${Date.now()}`,
          },
        });
      }

      return fraudScore;
    } catch (error) {
      this.logger.error('❌ Fraud analysis failed:', error);

      // Return conservative score on error
      return {
        overall: MEDIUM_RISK_THRESHOLD,
        components: {
          amountAnomaly: 0,
          locationAnomaly: 0,
          timePatternAnomaly: 0,
          deviceAnomaly: 0,
          merchantAnomaly: 0,
          velocityAnomaly: 0,
        },
        riskLevel: 'medium',
        reasons: ['Analysis failed - manual review required'],
        confidence: 0.5,
        recommendedAction: 'review',
      };
    }
  }

  /**
   * Analyze amount anomalies
   */
  private analyzeAmountAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    // Check for unusually high amounts
    if (profile.averageTransactionAmount > 0) {
      const deviation = transaction.amount / profile.averageTransactionAmount;

      if (deviation >= this.thresholds.unusualAmountMultiplier) {
        reasons.push(`Amount ${deviation.toFixed(1)}x above average`);
        return {
          score: Math.min(_MAX_SCORE, deviation * _AMOUNT_DEVIATION_MULTIPLIER),
          reasons,
        };
      }
    }

    // Check for known high-risk amounts
    if (this.fraudPatterns.highRiskAmounts.includes(transaction.amount)) {
      reasons.push(`High-risk amount: ${transaction.amount}`);
      return { score: _HIGH_RISK_AMOUNT_SCORE, reasons };
    }

    return { score, reasons };
  }

  /**
   * Analyze location anomalies
   */
  private analyzeLocationAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    const currentLocation = `${transaction.location.city}, ${transaction.location.country}`;

    // Check for high-risk countries
    if (
      this.fraudPatterns.highAmountLocations.includes(
        transaction.location.country
      )
    ) {
      reasons.push(
        `Transaction from high-risk country: ${transaction.location.country}`
      );
      return { score: HIGH_RISK_COUNTRY_SCORE, reasons };
    }

    // Check if location is unusual for this user
    if (profile.commonLocations.length > 0) {
      const isKnownLocation = profile.commonLocations.some(
        loc =>
          loc.includes(transaction.location.city) ||
          loc.includes(transaction.location.country)
      );

      if (!isKnownLocation) {
        reasons.push(`Unusual location: ${currentLocation}`);
        return { score: UNUSUAL_LOCATION_SCORE, reasons };
      }
    }

    return { score, reasons };
  }

  /**
   * Analyze time pattern anomalies
   */
  private analyzeTimePatternAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    const hour = transaction.timestamp.getHours();

    // Check for transactions at unusual hours
    if (hour < _EARLY_HOUR_THRESHOLD || hour > _LATE_HOUR_THRESHOLD) {
      reasons.push(`Transaction at unusual hour: ${hour}:00`);
      return { score: UNUSUAL_HOUR_SCORE, reasons };
    }

    // Check for rapid succession transactions
    if (profile.lastActivity) {
      const timeSinceLastTransaction =
        transaction.timestamp.getTime() - profile.lastActivity.getTime();

      if (
        timeSinceLastTransaction <
        RAPID_SUCCESSION_THRESHOLD_SECONDS * MILLISECONDS_PER_SECOND
      ) {
        // Less than 5 minutes
        reasons.push('Rapid succession transaction detected');
        return { score: RAPID_SUCCESSION_SCORE, reasons };
      }
    }

    return { score, reasons };
  }

  /**
   * Analyze device anomalies
   */
  private analyzeDeviceAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    // Check for device fingerprint changes
    if (transaction.deviceFingerprint && profile.commonDevices.length > 0) {
      const isKnownDevice = profile.commonDevices.includes(
        transaction.deviceFingerprint
      );

      if (!isKnownDevice) {
        reasons.push('Unknown device fingerprint');
        return { score: UNKNOWN_DEVICE_SCORE, reasons };
      }
    }

    return { score, reasons };
  }

  /**
   * Analyze merchant anomalies
   */
  private analyzeMerchantAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    // Check for suspicious merchant categories
    if (transaction.merchantCategory) {
      const isSuspiciousCategory = this.fraudPatterns.suspiciousMerchants.some(
        category =>
          transaction.merchantCategory?.toLowerCase().includes(category)
      );

      if (isSuspiciousCategory) {
        reasons.push(
          `Transaction to suspicious merchant category: ${transaction.merchantCategory}`
        );
        return { score: SUSPICIOUS_MERCHANT_SCORE, reasons };
      }
    }

    // Check for unusual merchant for this user
    if (transaction.merchantId && profile.commonMerchants.length > 0) {
      const isKnownMerchant = profile.commonMerchants.includes(
        transaction.merchantId
      );

      if (!isKnownMerchant) {
        reasons.push('Transaction to unusual merchant');
        return { score: UNUSUAL_MERCHANT_SCORE, reasons };
      }
    }

    return { score, reasons };
  }

  /**
   * Analyze transaction velocity anomalies
   */
  private analyzeVelocityAnomaly(
    transaction: TransactionData,
    profile: UserProfile
  ): { score: number; reasons: string[] } {
    const score = 0;
    const reasons: string[] = [];

    // Calculate transaction velocity (transactions per hour)
    const timeWindow =
      VELOCITY_TIME_WINDOW_MINUTES *
      SECONDS_PER_MINUTE *
      MILLISECONDS_PER_SECOND;
    const recentTransactions =
      transaction.previousTransactions?.filter(
        prev =>
          transaction.timestamp.getTime() - prev.timestamp.getTime() <=
          timeWindow
      ) ?? [];

    const velocity = recentTransactions.length + CURRENT_TRANSACTION_COUNT; // Include current transaction

    if (profile.transactionFrequency > 0) {
      const velocityRatio = velocity / profile.transactionFrequency;

      if (velocityRatio >= this.thresholds.highVelocityMultiplier) {
        reasons.push(
          `High transaction velocity: ${velocity} transactions/hour`
        );
        return {
          score: Math.min(
            _MAX_SCORE,
            velocityRatio * VELOCITY_RATIO_MULTIPLIER
          ),
          reasons,
        };
      }
    }

    return { score, reasons };
  }

  /**
   * Get or create user profile
   */
  private getOrCreateUserProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        averageTransactionAmount: 0,
        transactionFrequency: 0,
        commonLocations: [],
        commonMerchants: [],
        commonDevices: [],
        riskScore: 0,
        lastActivity: new Date(),
        totalTransactions: 0,
        fraudulentTransactions: 0,
      });
    }

    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    return profile;
  }

  /**
   * Update user profile with transaction data
   */
  private updateUserProfile(
    profile: UserProfile,
    transaction: TransactionData,
    fraudScore: FraudScore
  ): void {
    // Update transaction statistics
    profile.totalTransactions++;
    profile.lastActivity = transaction.timestamp;

    // Update average transaction amount
    const totalAmount =
      profile.averageTransactionAmount * (profile.totalTransactions - 1) +
      transaction.amount;
    profile.averageTransactionAmount = totalAmount / profile.totalTransactions;

    // Update common locations
    const location = `${transaction.location.city}, ${transaction.location.country}`;
    if (!profile.commonLocations.includes(location)) {
      profile.commonLocations.push(location);
      if (profile.commonLocations.length > MAX_COMMON_LOCATIONS) {
        profile.commonLocations =
          profile.commonLocations.slice(-MAX_COMMON_LOCATIONS);
      }
    }

    // Update common merchants
    if (
      transaction.merchantId &&
      !profile.commonMerchants.includes(transaction.merchantId)
    ) {
      profile.commonMerchants.push(transaction.merchantId);
      if (profile.commonMerchants.length > MAX_COMMON_MERCHANTS) {
        profile.commonMerchants =
          profile.commonMerchants.slice(-MAX_COMMON_MERCHANTS);
      }
    }

    // Update common devices
    if (
      transaction.deviceFingerprint &&
      !profile.commonDevices.includes(transaction.deviceFingerprint)
    ) {
      profile.commonDevices.push(transaction.deviceFingerprint);
      if (profile.commonDevices.length > MAX_COMMON_DEVICES) {
        profile.commonDevices =
          profile.commonDevices.slice(-MAX_COMMON_DEVICES);
      }
    }

    // Update risk score and fraudulent transaction count
    if (fraudScore.overall >= this.thresholds.highRiskScore) {
      profile.fraudulentTransactions++;
      profile.riskScore = Math.min(
        _MAX_SCORE,
        profile.riskScore + RISK_SCORE_INCREMENT
      );
    } else {
      // Gradually reduce risk score for legitimate transactions
      profile.riskScore = Math.max(0, profile.riskScore - RISK_SCORE_DECREMENT);
    }
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= CRITICAL_RISK_THRESHOLD) return 'critical';
    if (score >= HIGH_RISK_THRESHOLD) return 'high';
    if (score >= MEDIUM_RISK_THRESHOLD) return 'medium';
    return 'low';
  }

  /**
   * Determine recommended action based on score and reasons
   */
  private determineRecommendedAction(
    score: number,
    reasons: string[]
  ): 'approve' | 'review' | 'block' | 'investigate' {
    if (score >= this.thresholds.criticalRiskScore) {
      return 'block';
    }

    if (score >= this.thresholds.highRiskScore) {
      return reasons.length > MIN_REASONS_FOR_BLOCK ? 'block' : 'investigate';
    }

    if (score >= REVIEW_RISK_THRESHOLD) {
      return 'review';
    }

    return 'approve';
  }

  /**
   * Calculate confidence in the fraud score
   */
  private calculateConfidence(
    transaction: TransactionData,
    profile: UserProfile
  ): number {
    let confidence = BASE_CONFIDENCE; // Base confidence

    // Increase confidence with more transaction history
    if (profile.totalTransactions > HIGH_CONFIDENCE_TRANSACTION_THRESHOLD) {
      confidence += HIGH_CONFIDENCE_INCREMENT;
    } else if (
      profile.totalTransactions > MEDIUM_CONFIDENCE_TRANSACTION_THRESHOLD
    ) {
      confidence += MEDIUM_CONFIDENCE_INCREMENT;
    }

    // Increase confidence with complete transaction data
    if (transaction.deviceFingerprint && transaction.location.latitude) {
      confidence += COMPLETE_DATA_CONFIDENCE_INCREMENT;
    }

    // Decrease confidence for very new users
    if (profile.totalTransactions < NEW_USER_TRANSACTION_THRESHOLD) {
      confidence -= NEW_USER_CONFIDENCE_PENALTY;
    }

    return Math.max(MIN_CONFIDENCE, Math.min(MAX_CONFIDENCE, confidence));
  }

  /**
   * Get fraud detection statistics
   */
  getFraudDetectionStats(): {
    totalUsers: number;
    highRiskUsers: number;
    totalTransactions: number;
    fraudulentTransactions: number;
    averageRiskScore: number;
  } {
    const profiles = Array.from(this.userProfiles.values());
    const totalUsers = profiles.length;
    const highRiskUsers = profiles.filter(
      p => p.riskScore >= this.thresholds.highRiskScore
    ).length;
    const totalTransactions = profiles.reduce(
      (sum, p) => sum + p.totalTransactions,
      0
    );
    const fraudulentTransactions = profiles.reduce(
      (sum, p) => sum + p.fraudulentTransactions,
      0
    );
    const averageRiskScore =
      profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.riskScore, 0) / profiles.length
        : 0;

    return {
      totalUsers,
      highRiskUsers,
      totalTransactions,
      fraudulentTransactions,
      averageRiskScore,
    };
  }

  /**
   * Get user fraud profile
   */
  getUserFraudProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) ?? null;
  }

  /**
   * Reset user fraud profile (for testing or manual intervention)
   */
  resetUserFraudProfile(userId: string): boolean {
    if (this.userProfiles.has(userId)) {
      this.userProfiles.delete(userId);
      this.logger.log(`🔄 Reset fraud profile for user: ${userId}`);
      return true;
    }
    return false;
  }
}
