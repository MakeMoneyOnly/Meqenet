import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import {
  AIFraudDetectionService,
  TransactionData,
  FraudScore,
} from '../services/ai-fraud-detection.service';

// Constants for magic numbers
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

const SUSPICIOUS_TIME_WINDOW_HOURS = 2;
const HIGH_RISK_AMOUNT_1 = 10000;
const HIGH_RISK_AMOUNT_2 = 50000;
const HIGH_RISK_AMOUNT_3 = 100000;

@ApiTags('AI Fraud Detection')
@Controller('ai/fraud-detection')
export class AIFraudDetectionController {
  private readonly logger = new Logger(AIFraudDetectionController.name);

  constructor(
    private readonly aiFraudDetectionService: AIFraudDetectionService
  ) {}

  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze transaction for fraud',
    description: 'Uses AI-powered analysis to detect fraudulent transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Fraud analysis completed successfully',
    schema: {
      type: 'object',
      properties: {
        overall: { type: 'number', description: 'Overall fraud score (0-100)' },
        riskLevel: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        recommendedAction: {
          type: 'string',
          enum: ['approve', 'review', 'block', 'investigate'],
        },
        reasons: { type: 'array', items: { type: 'string' } },
        confidence: {
          type: 'number',
          description: 'Confidence in analysis (0-1)',
        },
      },
    },
  })
  async analyzeTransaction(
    @Body() transactionData: TransactionData
  ): Promise<FraudScore> {
    try {
      this.logger.log(
        `🧠 Analyzing transaction for user: ${transactionData.userId}`
      );

      const fraudScore =
        await this.aiFraudDetectionService.analyzeTransaction(transactionData);

      this.logger.log(
        `✅ Fraud analysis completed: ${fraudScore.overall} (${fraudScore.riskLevel}) - ${fraudScore.recommendedAction}`
      );

      return fraudScore;
    } catch (error) {
      this.logger.error('❌ Fraud analysis failed:', error);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get fraud detection statistics',
    description:
      'Returns comprehensive statistics about fraud detection performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        highRiskUsers: { type: 'number' },
        totalTransactions: { type: 'number' },
        fraudulentTransactions: { type: 'number' },
        averageRiskScore: { type: 'number' },
      },
    },
  })
  async getFraudDetectionStats(): Promise<
    ReturnType<AIFraudDetectionService['getFraudDetectionStats']>
  > {
    try {
      this.logger.log('📊 Retrieving fraud detection statistics');

      const stats = this.aiFraudDetectionService.getFraudDetectionStats();

      this.logger.log(`✅ Retrieved stats for ${stats.totalUsers} users`);

      return stats;
    } catch (error) {
      this.logger.error('❌ Failed to retrieve fraud detection stats:', error);
      throw error;
    }
  }

  @Get('users/:userId/profile')
  @ApiOperation({
    summary: 'Get user fraud profile',
    description: 'Returns the fraud detection profile for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async getUserFraudProfile(
    @Param('userId') userId: string
  ): Promise<
    | ReturnType<AIFraudDetectionService['getUserFraudProfile']>
    | { error: string; message: string }
  > {
    try {
      this.logger.log(`👤 Retrieving fraud profile for user: ${userId}`);

      const profile = this.aiFraudDetectionService.getUserFraudProfile(userId);

      if (!profile) {
        return {
          error: 'User profile not found',
          message: 'No fraud detection data available for this user',
        };
      }

      this.logger.log(`✅ Retrieved fraud profile for user: ${userId}`);

      return profile;
    } catch (error) {
      this.logger.error(
        `❌ Failed to retrieve fraud profile for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  @Post('users/:userId/reset-profile')
  @ApiOperation({
    summary: 'Reset user fraud profile',
    description:
      'Resets the fraud detection profile for a user (admin function)',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile reset successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  async resetUserFraudProfile(
    @Param('userId') userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🔄 Resetting fraud profile for user: ${userId}`);

      const success =
        this.aiFraudDetectionService.resetUserFraudProfile(userId);

      if (!success) {
        return {
          success: false,
          message: 'User profile not found or could not be reset',
        };
      }

      this.logger.log(`✅ Fraud profile reset for user: ${userId}`);

      return {
        success: true,
        message: 'User fraud profile has been reset',
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to reset fraud profile for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  @Get('risk-thresholds')
  @ApiOperation({
    summary: 'Get current risk thresholds',
    description:
      'Returns the current fraud detection risk thresholds and configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk thresholds retrieved successfully',
  })
  async getRiskThresholds(): Promise<{
    thresholds: Record<string, unknown>;
    description: string;
    lastUpdated: string;
  }> {
    try {
      // In a real implementation, these would come from the service
      const thresholds = {
        highRiskScore: 75,
        criticalRiskScore: 90,
        unusualAmountMultiplier: 3.0,
        unusualLocationThreshold: 0.8,
        highVelocityMultiplier: 5.0,
        suspiciousTimeWindowMs:
          SUSPICIOUS_TIME_WINDOW_HOURS *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MILLISECONDS_PER_SECOND,
        highRiskCountries: ['North Korea', 'Iran', 'Syria', 'Cuba'],
        suspiciousMerchantCategories: ['crypto', 'gambling', 'darkweb'],
        highRiskAmounts: [
          HIGH_RISK_AMOUNT_1,
          HIGH_RISK_AMOUNT_2,
          HIGH_RISK_AMOUNT_3,
        ],
      };

      return {
        thresholds,
        description:
          'Current fraud detection risk thresholds and configuration',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Failed to retrieve risk thresholds:', error);
      throw error;
    }
  }

  @Post('test-fraud-patterns')
  @ApiOperation({
    summary: 'Test fraud detection with sample patterns',
    description:
      'Allows testing of fraud detection with predefined suspicious patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'Fraud pattern test completed',
  })
  async testFraudPatterns(): Promise<{
    testResults: Array<{
      testCase: Partial<TransactionData>;
      fraudScore: FraudScore;
    }>;
    summary: {
      totalTests: number;
      highRiskDetected: number;
      blockedTransactions: number;
    };
  }> {
    try {
      this.logger.log('🧪 Testing fraud detection patterns');

      // Test cases for different fraud patterns
      const testCases: TransactionData[] = [
        {
          userId: 'test-user-1',
          amount: 100000, // High-risk amount
          currency: 'USD',
          location: { country: 'North Korea', city: 'Pyongyang' }, // High-risk country
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Suspicious Agent',
          paymentMethod: 'credit_card',
        },
        {
          userId: 'test-user-2',
          amount: 10,
          currency: 'USD',
          merchantCategory: 'crypto', // Suspicious merchant
          location: { country: 'United States', city: 'New York' },
          timestamp: new Date(),
          ipAddress: '192.168.1.2',
          userAgent: 'Normal Agent',
          paymentMethod: 'debit_card',
        },
      ];

      const results = [];

      for (const testCase of testCases) {
        const fraudScore =
          await this.aiFraudDetectionService.analyzeTransaction(testCase);
        results.push({
          testCase: {
            userId: testCase.userId,
            amount: testCase.amount,
            country: testCase.location.country,
            ...(testCase.merchantCategory && {
              merchantCategory: testCase.merchantCategory,
            }),
          },
          fraudScore,
        });
      }

      this.logger.log('✅ Fraud pattern testing completed');

      return {
        testResults: results,
        summary: {
          totalTests: results.length,
          highRiskDetected: results.filter(
            r =>
              r.fraudScore.riskLevel === 'high' ||
              r.fraudScore.riskLevel === 'critical'
          ).length,
          blockedTransactions: results.filter(
            r => r.fraudScore.recommendedAction === 'block'
          ).length,
        },
      };
    } catch (error) {
      this.logger.error('❌ Fraud pattern testing failed:', error);
      throw error;
    }
  }
}
