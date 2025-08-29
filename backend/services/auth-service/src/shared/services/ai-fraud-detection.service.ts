import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnomalyDetectionService } from './anomaly-detection.service';
import { SecurityMonitoringService } from './security-monitoring.service';

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
    highRiskScore: 75,
    criticalRiskScore: 90,
    unusualAmountMultiplier: 3.0,
    unusualLocationThreshold: 0.8,
    highVelocityMultiplier: 5.0,
    suspiciousTimeWindow: 2 * 60 * 60 * 1000, // 2 hours
  };

  // Known fraudulent patterns
  private readonly fraudPatterns = {
    highAmountLocations: ['North Korea', 'Iran', 'Syria', 'Cuba'],
    suspiciousMerchants: ['crypto', 'gambling', 'darkweb'],
    highRiskAmounts: [10000, 50000, 100000], // Threshold amounts
  };

  constructor(
    private configService: ConfigService,
    private securityMonitoringService: SecurityMonitoringService,
    private anomalyDetectionService: AnomalyDetectionService,
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
      const locationAnomaly = this.analyzeLocationAnomaly(transaction, userProfile);
      const timePatternAnomaly = this.analyzeTimePatternAnomaly(transaction, userProfile);
      const deviceAnomaly = this.analyzeDeviceAnomaly(transaction, userProfile);
      const merchantAnomaly = this.analyzeMerchantAnomaly(transaction, userProfile);
      const velocityAnomaly = this.analyzeVelocityAnomaly(transaction, userProfile);

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
        amountAnomaly: 0.25,
        locationAnomaly: 0.20,
        timePatternAnomaly: 0.15,
        deviceAnomaly: 0.15,
        merchantAnomaly: 0.10,
        velocityAnomaly: 0.15,
      };

      const overallScore = Object.entries(components).reduce(
        (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
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
      const recommendedAction = this.determineRecommendedAction(overallScore, reasons);

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
          severity: overallScore >= this.thresholds.criticalRiskScore ? 'critical' : 'high',
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
        overall: 50,
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
        return { score: Math.min(100, deviation * 20), reasons };
      }
    }

    // Check for known high-risk amounts
    if (this.fraudPatterns.highRiskAmounts.includes(transaction.amount)) {
      reasons.push(`High-risk amount: ${transaction.amount}`);
      return { score: 80, reasons };
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
    if (this.fraudPatterns.highAmountLocations.includes(transaction.location.country)) {
      reasons.push(`Transaction from high-risk country: ${transaction.location.country}`);
      return { score: 90, reasons };
    }

    // Check if location is unusual for this user
    if (profile.commonLocations.length > 0) {
      const isKnownLocation = profile.commonLocations.some(loc =>
        loc.includes(transaction.location.city) ||
        loc.includes(transaction.location.country)
      );

      if (!isKnownLocation) {
        reasons.push(`Unusual location: ${currentLocation}`);
        return { score: 70, reasons };
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
    if (hour < 6 || hour > 22) {
      reasons.push(`Transaction at unusual hour: ${hour}:00`);
      return { score: 40, reasons };
    }

    // Check for rapid succession transactions
    if (profile.lastActivity) {
      const timeSinceLastTransaction = transaction.timestamp.getTime() - profile.lastActivity.getTime();

      if (timeSinceLastTransaction < 5 * 60 * 1000) { // Less than 5 minutes
        reasons.push('Rapid succession transaction detected');
        return { score: 60, reasons };
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
      const isKnownDevice = profile.commonDevices.includes(transaction.deviceFingerprint);

      if (!isKnownDevice) {
        reasons.push('Unknown device fingerprint');
        return { score: 65, reasons };
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
      const isSuspiciousCategory = this.fraudPatterns.suspiciousMerchants.some(category =>
        transaction.merchantCategory?.toLowerCase().includes(category)
      );

      if (isSuspiciousCategory) {
        reasons.push(`Transaction to suspicious merchant category: ${transaction.merchantCategory}`);
        return { score: 85, reasons };
      }
    }

    // Check for unusual merchant for this user
    if (transaction.merchantId && profile.commonMerchants.length > 0) {
      const isKnownMerchant = profile.commonMerchants.includes(transaction.merchantId);

      if (!isKnownMerchant) {
        reasons.push('Transaction to unusual merchant');
        return { score: 45, reasons };
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
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const recentTransactions = transaction.previousTransactions?.filter(
      prev => transaction.timestamp.getTime() - prev.timestamp.getTime() <= timeWindow
    ) || [];

    const velocity = recentTransactions.length + 1; // Include current transaction

    if (profile.transactionFrequency > 0) {
      const velocityRatio = velocity / profile.transactionFrequency;

      if (velocityRatio >= this.thresholds.highVelocityMultiplier) {
        reasons.push(`High transaction velocity: ${velocity} transactions/hour`);
        return { score: Math.min(100, velocityRatio * 15), reasons };
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

    return this.userProfiles.get(userId)!;
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
    const totalAmount = profile.averageTransactionAmount * (profile.totalTransactions - 1) + transaction.amount;
    profile.averageTransactionAmount = totalAmount / profile.totalTransactions;

    // Update common locations
    const location = `${transaction.location.city}, ${transaction.location.country}`;
    if (!profile.commonLocations.includes(location)) {
      profile.commonLocations.push(location);
      if (profile.commonLocations.length > 10) {
        profile.commonLocations = profile.commonLocations.slice(-10);
      }
    }

    // Update common merchants
    if (transaction.merchantId && !profile.commonMerchants.includes(transaction.merchantId)) {
      profile.commonMerchants.push(transaction.merchantId);
      if (profile.commonMerchants.length > 20) {
        profile.commonMerchants = profile.commonMerchants.slice(-20);
      }
    }

    // Update common devices
    if (transaction.deviceFingerprint && !profile.commonDevices.includes(transaction.deviceFingerprint)) {
      profile.commonDevices.push(transaction.deviceFingerprint);
      if (profile.commonDevices.length > 5) {
        profile.commonDevices = profile.commonDevices.slice(-5);
      }
    }

    // Update risk score and fraudulent transaction count
    if (fraudScore.overall >= this.thresholds.highRiskScore) {
      profile.fraudulentTransactions++;
      profile.riskScore = Math.min(100, profile.riskScore + 10);
    } else {
      // Gradually reduce risk score for legitimate transactions
      profile.riskScore = Math.max(0, profile.riskScore - 1);
    }
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
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
      return reasons.length > 2 ? 'block' : 'investigate';
    }

    if (score >= 60) {
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
    let confidence = 0.5; // Base confidence

    // Increase confidence with more transaction history
    if (profile.totalTransactions > 10) {
      confidence += 0.2;
    } else if (profile.totalTransactions > 5) {
      confidence += 0.1;
    }

    // Increase confidence with complete transaction data
    if (transaction.deviceFingerprint && transaction.location.latitude) {
      confidence += 0.2;
    }

    // Decrease confidence for very new users
    if (profile.totalTransactions < 3) {
      confidence -= 0.3;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
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
    const highRiskUsers = profiles.filter(p => p.riskScore >= this.thresholds.highRiskScore).length;
    const totalTransactions = profiles.reduce((sum, p) => sum + p.totalTransactions, 0);
    const fraudulentTransactions = profiles.reduce((sum, p) => sum + p.fraudulentTransactions, 0);
    const averageRiskScore = profiles.length > 0
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
    return this.userProfiles.get(userId) || null;
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
