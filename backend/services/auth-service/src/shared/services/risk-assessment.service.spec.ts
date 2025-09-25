import { Test, TestingModule } from '@nestjs/testing';
import { RiskAssessmentService, RiskFactors } from './risk-assessment.service';
import { SecurityMonitoringService } from './security-monitoring.service';
import { vi } from 'vitest';

describe('RiskAssessmentService', () => {
  let service: RiskAssessmentService;

  const mockSecurityMonitoringService = {
    recordAnomalyDetection: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskAssessmentService,
        {
          provide: SecurityMonitoringService,
          useValue: mockSecurityMonitoringService,
        },
      ],
    }).compile();

    service = module.get<RiskAssessmentService>(RiskAssessmentService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const getBaseRiskFactors = (): RiskFactors => ({
    userId: 'user-123',
    ipAddress: '192.168.1.10',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    location: 'New York, USA',
    deviceFingerprint: 'fingerprint-123',
    loginTime: new Date(2024, 0, 1, 12, 0, 0, 0), // Fixed time: 12:00 PM, not suspicious
    previousLoginTime: new Date(Date.now() - 86400000), // 1 day ago
    previousLoginLocation: 'New York, USA',
    failedAttemptsCount: 0,
    accountAge: 86400000 * 2, // 2 days old
    unusualPatterns: false,
  });

  describe('Risk Score Calculation', () => {
    it('should return a LOW risk score for a normal login', async () => {
      const factors = getBaseRiskFactors();
      const assessment = await service.assessRisk(factors);

      expect(assessment.level).toBe('LOW');
      expect(assessment.score).toBe(0);
      expect(assessment.requiresMfa).toBe(false);
    });

    it('should add score for a new device', async () => {
      const factors = getBaseRiskFactors();
      // Mocking the private method's behavior for test purposes
      vi.spyOn(service as any, 'isNewDevice').mockResolvedValue(true);

      const assessment = await service.assessRisk(factors);
      expect(assessment.score).toBe(15);
      expect(assessment.factors).toContain('New device detected');
    });

    it('should add score for an unusual location', async () => {
      const factors = getBaseRiskFactors();
      factors.previousLoginLocation = 'London, UK';
      const assessment = await service.assessRisk(factors);

      expect(assessment.score).toBe(25);
      expect(assessment.factors).toContain('Unusual location detected');
    });

    it('should add score for suspicious login time', async () => {
      const factors = getBaseRiskFactors();
      factors.loginTime.setHours(3); // 3 AM
      const assessment = await service.assessRisk(factors);

      expect(assessment.score).toBe(10);
      expect(assessment.factors).toContain('Login during unusual hours');
    });

    it('should add score for failed attempts', async () => {
      const factors = getBaseRiskFactors();
      factors.failedAttemptsCount = 3;
      const assessment = await service.assessRisk(factors);

      expect(assessment.score).toBe(12);
      expect(assessment.factors).toContain('3 recent failed attempts');
    });

    it('should add score for a new account', async () => {
      const factors = getBaseRiskFactors();
      factors.accountAge = 3600000; // 1 hour old
      const assessment = await service.assessRisk(factors);

      expect(assessment.score).toBe(5);
      expect(assessment.factors).toContain('New account login');
    });

    it('should add score for a suspicious user agent', async () => {
      const factors = getBaseRiskFactors();
      factors.userAgent = 'curl/7.64.1';
      const assessment = await service.assessRisk(factors);

      expect(assessment.score).toBe(10);
      expect(assessment.factors).toContain('Automated tool detected');
    });

    it('should combine scores from multiple risk factors', async () => {
      const factors = getBaseRiskFactors();
      factors.previousLoginLocation = 'London, UK'; // 25
      factors.loginTime.setHours(4); // 10
      factors.failedAttemptsCount = 1; // 4

      const assessment = await service.assessRisk(factors);
      expect(assessment.score).toBe(39);
      expect(assessment.level).toBe('MEDIUM');
      expect(assessment.requiresMfa).toBe(false);
    });
  });

  describe('Risk Level and Actions', () => {
    it('should trigger MFA for MEDIUM risk score', async () => {
      const factors = getBaseRiskFactors();
      factors.previousLoginLocation = 'London, UK'; // 25
      factors.userAgent = 'curl/7.64.1'; // 10
      vi.spyOn(service as any, 'isNewDevice').mockResolvedValue(true); // 15

      const assessment = await service.assessRisk(factors); // Total = 50

      expect(assessment.score).toBe(50);
      expect(assessment.level).toBe('HIGH'); // Threshold for HIGH is >= 50
      expect(assessment.requiresMfa).toBe(true);
      expect(assessment.requiresStepUp).toBe(false);
    });

    it('should trigger Step-Up Auth for HIGH risk score', async () => {
      const factors = getBaseRiskFactors();
      factors.previousLoginLocation = 'Moscow, RU'; // 25
      factors.userAgent = 'python-requests/2.25.1'; // 10
      vi.spyOn(service as any, 'isNewDevice').mockResolvedValue(true); // 15
      factors.failedAttemptsCount = 4; // 16
      factors.loginTime.setHours(2); // 10

      const assessment = await service.assessRisk(factors); // Total = 76

      expect(assessment.score).toBe(76);
      expect(assessment.level).toBe('CRITICAL'); // Threshold for CRITICAL is >= 75
      expect(assessment.requiresMfa).toBe(true);
      expect(assessment.requiresStepUp).toBe(true);
    });

    it('should log an anomaly for high risk assessments', async () => {
      const factors = getBaseRiskFactors();
      factors.previousLoginLocation = 'Tehran, IR'; // 25
      factors.userAgent = 'postman/9.1'; // 10
      vi.spyOn(service as any, 'isNewDevice').mockResolvedValue(true); // 15
      factors.failedAttemptsCount = 5; // 20

      await service.assessRisk(factors); // Total = 70, level = HIGH

      expect(
        mockSecurityMonitoringService.recordAnomalyDetection
      ).toHaveBeenCalled();
      expect(
        mockSecurityMonitoringService.recordAnomalyDetection
      ).toHaveBeenCalledWith(
        'high_risk_login',
        0.7,
        factors.userId,
        expect.any(Array)
      );
    });
  });
});
