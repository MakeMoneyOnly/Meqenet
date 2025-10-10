import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

import {
  RiskAssessmentService,
  RiskAssessment,
} from '../services/risk-assessment.service';
import { SecurityMonitoringService } from '../services/security-monitoring.service';

// Constants for magic numbers
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const DAYS_FOR_ACCOUNT_AGE = 7;

// Type definitions
interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

interface RequestWithAuth extends Request {
  riskAssessment?: RiskAssessment;
  userId?: string;
  user?: { id: string; email?: string; role?: string };
  adaptiveAuth?: {
    requiresMfa: boolean;
    mfaSuggested: boolean;
    mfaToken: string | null;
  };
}

export interface AdaptiveAuthResult {
  allowed: boolean;
  requiresMfa: boolean;
  requiresStepUp: boolean;
  riskAssessment: RiskAssessment;
  userId: string;
}

@Injectable()
export class AdaptiveAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdaptiveAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => RiskAssessmentService))
    private riskAssessmentService: RiskAssessmentService,
    @Inject(forwardRef(() => SecurityMonitoringService))
    private securityMonitoring: SecurityMonitoringService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const response = context.switchToHttp().getResponse();

    try {
      // Extract token from Authorization header
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      const userId = payload.sub as string;

      // Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(request, userId);

      // Handle different risk levels and build auth state atomically
      let adaptiveAuthState: {
        requiresMfa: boolean;
        mfaSuggested: boolean;
        mfaToken: string | null;
      };

      switch (riskAssessment.level) {
        case 'CRITICAL':
          await this.handleCriticalRisk(request, riskAssessment);
          adaptiveAuthState = {
            requiresMfa: false,
            mfaSuggested: false,
            mfaToken: null,
          };
          break;
        case 'HIGH':
          adaptiveAuthState = await this.buildHighRiskAuthState(
            request,
            riskAssessment,
            response
          );
          break;
        case 'MEDIUM':
          adaptiveAuthState = await this.buildMediumRiskAuthState(
            request,
            riskAssessment,
            response
          );
          break;
        case 'LOW':
        default:
          adaptiveAuthState = await this.buildLowRiskAuthState(
            request,
            riskAssessment
          );
          break;
      }

      // Atomic assignment: prevents race conditions in concurrent auth requests (PCI DSS compliance)
      Object.assign(request, {
        riskAssessment,
        userId,
        adaptiveAuth: adaptiveAuthState,
      });

      return true;
    } catch (error) {
      this.logger.error('Adaptive authentication failed:', error);
      throw error;
    }
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Perform risk assessment for the request
   */
  private async performRiskAssessment(
    request: Request,
    userId: string
  ): Promise<RiskAssessment> {
    const clientIp = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const deviceFingerprint = request.headers['x-device-fingerprint'] as string;

    // Get user's previous login information (this would come from database/cache)
    const previousLoginData = await this.getPreviousLoginData(userId);

    const riskFactors = {
      userId,
      ipAddress: clientIp,
      ...(userAgent && { userAgent }),
      location: request.headers['x-user-location'] as string,
      deviceFingerprint,
      loginTime: new Date(),
      previousLoginTime: previousLoginData?.lastLoginAt,
      previousLoginLocation: previousLoginData?.lastLoginLocation,
      failedAttemptsCount: previousLoginData?.failedAttemptsCount || 0,
      accountAge: previousLoginData?.accountAge,
      unusualPatterns: false, // Would be determined by ML models
    };

    return await this.riskAssessmentService.assessRisk(riskFactors);
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    return request.ip || 'unknown';
  }

  /**
   * Get previous login data for user (would typically come from database)
   */
  private async getPreviousLoginData(_userId: string): Promise<{
    lastLoginAt?: Date;
    lastLoginLocation?: string;
    failedAttemptsCount: number;
    accountAge?: number;
  } | null> {
    // This would typically query the database
    // For now, return mock data
    return {
      lastLoginAt: new Date(
        Date.now() -
          HOURS_PER_DAY *
            MINUTES_PER_HOUR *
            SECONDS_PER_MINUTE *
            MILLISECONDS_PER_SECOND
      ), // 24 hours ago
      lastLoginLocation: 'Addis Ababa, Ethiopia',
      failedAttemptsCount: 0,
      accountAge:
        DAYS_FOR_ACCOUNT_AGE *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLISECONDS_PER_SECOND, // 7 days
    };
  }

  /**
   * Handle critical risk level
   */
  private async handleCriticalRisk(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment
  ): Promise<void> {
    this.logger.warn(
      `Critical risk detected for user ${(request as RequestWithAuth).user?.id || 'unknown'}`
    );

    // Log security event
    await this.securityMonitoring.recordSecurityEvent({
      type: 'authentication',
      severity: 'critical',
      userId: (request as RequestWithAuth).user?.id || 'unknown',
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'] as string,
      description: `Critical risk login attempt blocked: ${riskAssessment.factors.join(', ')}`,
      metadata: {
        riskScore: riskAssessment.score,
        riskFactors: riskAssessment.factors,
      },
    });

    // Block the request
    throw new UnauthorizedException({
      errorCode: 'CRITICAL_RISK_BLOCKED',
      message: 'Login blocked due to critical security risk',
      riskFactors: riskAssessment.factors,
    });
  }

  /**
   * Handle high risk level
   */
  private async handleHighRisk(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment,
    response: Response
  ): Promise<void> {
    this.logger.warn(
      `High risk detected for user ${(request as RequestWithAuth).user?.id || 'unknown'}`
    );

    // Log security event
    await this.securityMonitoring.recordSecurityEvent({
      type: 'authentication',
      severity: 'high',
      userId: (request as RequestWithAuth).user?.id || 'unknown',
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'] as string,
      description: `High risk login - MFA required: ${riskAssessment.factors.join(', ')}`,
      metadata: {
        riskScore: riskAssessment.score,
        riskFactors: riskAssessment.factors,
      },
    });

    // Set headers to indicate MFA is required
    response.setHeader('X-MFA-Required', 'true');
    response.setHeader('X-Risk-Level', 'HIGH');
    response.setHeader(
      'X-Risk-Factors',
      JSON.stringify(riskAssessment.factors)
    );
  }

  /**
   * Build auth state for high risk level - returns state instead of mutating request
   */
  private async buildHighRiskAuthState(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment,
    response: Response
  ): Promise<{
    requiresMfa: boolean;
    mfaSuggested: boolean;
    mfaToken: string | null;
  }> {
    await this.handleHighRisk(request, riskAssessment, response);
    return {
      requiresMfa: true,
      mfaSuggested: false,
      mfaToken: this.generateMfaToken(),
    };
  }

  /**
   * Handle medium risk level
   */
  private async handleMediumRisk(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment,
    response: Response
  ): Promise<void> {
    // Log security event
    await this.securityMonitoring.recordSecurityEvent({
      type: 'authentication',
      severity: 'medium',
      userId: request.user?.id || 'unknown',
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'] as string,
      description: `Medium risk login detected: ${riskAssessment.factors.join(', ')}`,
      metadata: {
        riskScore: riskAssessment.score,
        riskFactors: riskAssessment.factors,
      },
    });

    // Set headers to indicate optional MFA
    response.setHeader('X-MFA-Suggested', 'true');
    response.setHeader('X-Risk-Level', 'MEDIUM');
    response.setHeader(
      'X-Risk-Factors',
      JSON.stringify(riskAssessment.factors)
    );
  }

  /**
   * Build auth state for medium risk level - returns state instead of mutating request
   */
  private async buildMediumRiskAuthState(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment,
    response: Response
  ): Promise<{
    requiresMfa: boolean;
    mfaSuggested: boolean;
    mfaToken: string | null;
  }> {
    await this.handleMediumRisk(request, riskAssessment, response);
    return {
      requiresMfa: false,
      mfaSuggested: true,
      mfaToken: null,
    };
  }

  /**
   * Handle low risk level
   */
  private async handleLowRisk(
    request: RequestWithAuth,
    _riskAssessment: RiskAssessment
  ): Promise<void> {
    // Log normal activity
    this.logger.debug(
      `Low risk login for user ${request.user?.id || 'unknown'}`
    );
  }

  /**
   * Build auth state for low risk level - returns state instead of mutating request
   */
  private async buildLowRiskAuthState(
    request: RequestWithAuth,
    riskAssessment: RiskAssessment
  ): Promise<{
    requiresMfa: boolean;
    mfaSuggested: boolean;
    mfaToken: string | null;
  }> {
    await this.handleLowRisk(request, riskAssessment);
    return {
      requiresMfa: false,
      mfaSuggested: false,
      mfaToken: null,
    };
  }

  /**
   * Generate MFA challenge token
   */
  private generateMfaToken(): string {
    const TOKEN_LENGTH_BYTES = 32;
    return require('crypto').randomBytes(TOKEN_LENGTH_BYTES).toString('hex');
  }

  /**
   * Get adaptive auth result for use in controllers
   */
  static getAdaptiveAuthResult(
    request: RequestWithAuth
  ): AdaptiveAuthResult | null {
    const riskAssessment = request.riskAssessment;
    const userId = request.userId;
    const adaptiveAuthState = request.adaptiveAuth;

    if (!riskAssessment || !userId || !adaptiveAuthState) {
      return null;
    }

    return {
      allowed: true,
      requiresMfa: adaptiveAuthState.requiresMfa,
      requiresStepUp: riskAssessment.requiresStepUp,
      riskAssessment,
      userId,
    };
  }
}
