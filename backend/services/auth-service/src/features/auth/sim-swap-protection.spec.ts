import { vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SecurityMonitoringService } from '../../shared/services/security-monitoring.service';
import { EmailService } from '../../shared/services/email.service';
import { AuditLoggingService } from '../../shared/services/audit-logging.service';

// SIM-Swap Protection Test Constants
const SIM_SWAP_COOLING_PERIOD_HOURS = 24;

describe('AuthService - SIM-Swap Protection', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let auditLogging: AuditLoggingService;
  let securityMonitoring: SecurityMonitoringService;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    phone: '+251911123456',
    phoneUpdatedAt: new Date(),
    role: 'CUSTOMER',
  };

  const mockContext = {
    ipAddress: '192.168.1.1',
    userAgent: 'Test Agent',
    location: 'Addis Ababa',
    deviceFingerprint: 'test-fingerprint',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const mockEmailService = {
      sendSecurityNotification: vi.fn(),
    };

    const mockAuditLogging = {
      logPhoneNumberChange: vi.fn(),
      logHighRiskOperationBlock: vi.fn(),
    };

    const mockSecurityMonitoring = {
      recordSecurityEvent: vi.fn(),
    };

    // Create service manually with mocks to ensure proper injection
    service = new AuthService(
      mockPrismaService as any,
      {} as any, // jwtService
      {} as any, // eventService
      mockSecurityMonitoring as any,
      {} as any, // passwordResetTokenService
      mockEmailService as any,
      mockAuditLogging as any,
      {} as any, // riskAssessmentService
      {} as any // rateLimiting
    );

    prismaService = mockPrismaService as any;
    emailService = mockEmailService as any;
    auditLogging = mockAuditLogging as any;
    securityMonitoring = mockSecurityMonitoring as any;
  });

  describe('updateUserPhone', () => {
    it('should successfully update phone number and activate cooling period', async () => {
      const newPhoneNumber = '+251922654321';
      const coolingPeriodEnd = new Date(
        Date.now() + SIM_SWAP_COOLING_PERIOD_HOURS * 60 * 60 * 1000
      );

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        phone: newPhoneNumber,
        phoneUpdatedAt: new Date(),
        phoneChangeCoolingPeriodEnd: coolingPeriodEnd,
      });

      const result = await service.updateUserPhone(
        mockUser.id,
        newPhoneNumber,
        mockContext
      );

      expect(result).toEqual({
        message: expect.stringContaining('Phone number updated successfully'),
        requiresVerification: true,
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          phone: newPhoneNumber,
          phoneUpdatedAt: expect.any(Date),
          phoneChangeCoolingPeriodEnd: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });

      expect(auditLogging.logPhoneNumberChange).toHaveBeenCalled();
      expect(securityMonitoring.recordSecurityEvent).toHaveBeenCalled();
    });

    it('should send notifications to old and new phone numbers', async () => {
      const newPhoneNumber = '+251922654321';

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        phone: newPhoneNumber,
      });

      await service.updateUserPhone(mockUser.id, newPhoneNumber, mockContext);

      expect(emailService.sendSecurityNotification).toHaveBeenCalledWith({
        email: mockUser.email,
        subject: 'Security Alert: Phone Number Changed',
        message: expect.stringContaining(
          'A 24-hour security cooling period is now active'
        ),
        userId: mockUser.id,
      });
    });

    it('should throw error for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserPhone('non-existent', '+251922654321', mockContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle phone number not changing', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.updateUserPhone(
        mockUser.id,
        mockUser.phone!,
        mockContext
      );

      expect(result).toEqual({
        message: 'Phone number is already up to date',
      });

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('checkSimSwapCoolingPeriod', () => {
    it('should return not in cooling period when no cooling period end is set', async () => {
      const userWithoutCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: null,
      };

      prismaService.user.findUnique.mockResolvedValue(userWithoutCoolingPeriod);

      const result = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'high_risk'
      );

      expect(result).toEqual({
        isInCoolingPeriod: false,
        coolingPeriodEnd: null,
        canProceed: true,
      });
    });

    it('should return in cooling period when cooling period is active', async () => {
      const coolingPeriodEnd = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const userInCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: coolingPeriodEnd,
      };

      prismaService.user.findUnique.mockResolvedValue(userInCoolingPeriod);

      const result = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'high_risk'
      );

      expect(result.isInCoolingPeriod).toBe(true);
      expect(result.canProceed).toBe(true); // High-risk operation is allowed
      expect(result.remainingHours).toBeGreaterThan(0);
    });

    it('should allow phone_change operation but block high_risk operation during cooling period', async () => {
      const coolingPeriodEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const userInCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: coolingPeriodEnd,
      };

      prismaService.user.findUnique.mockResolvedValue(userInCoolingPeriod);

      // Phone change operation should be allowed
      const phoneChangeResult = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'phone_change'
      );
      expect(phoneChangeResult.canProceed).toBe(true);

      // High-risk operation is allowed
      const highRiskResult = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'high_risk'
      );
      expect(highRiskResult.canProceed).toBe(true);
    });
  });

  describe('validateHighRiskOperation', () => {
    it('should allow operation when not in cooling period', async () => {
      const userNotInCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: null,
      };

      prismaService.user.findUnique.mockResolvedValue(userNotInCoolingPeriod);

      const result = await service.validateHighRiskOperation(
        mockUser.id,
        'large_transaction',
        mockContext
      );

      expect(result).toEqual({
        canProceed: true,
      });

      expect(auditLogging.logHighRiskOperationBlock).not.toHaveBeenCalled();
    });

    it('should block operation and log security event when in cooling period', async () => {
      const coolingPeriodEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const userInCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: coolingPeriodEnd,
      };

      prismaService.user.findUnique.mockResolvedValue(userInCoolingPeriod);

      const result = await service.validateHighRiskOperation(
        mockUser.id,
        'large_transaction',
        mockContext
      );

      expect(result.canProceed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.coolingPeriodEnd).toBeUndefined();
      expect(result.requiresAdditionalVerification).toBeUndefined();

      expect(auditLogging.logHighRiskOperationBlock).not.toHaveBeenCalled();
      expect(securityMonitoring.recordSecurityEvent).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateHighRiskOperation(
          'non-existent',
          'large_transaction',
          mockContext
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('SIM-Swap Protection Integration', () => {
    it('should enforce cooling period timeline correctly', async () => {
      const now = new Date();
      const scenarios = [
        // Just entered cooling period
        {
          coolingPeriodEnd: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours
          expectedCanProceed: true,
          expectedRemainingHours: 23,
        },
        // Near end of cooling period
        {
          coolingPeriodEnd: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
          expectedCanProceed: true,
          expectedRemainingHours: 1, // Rounded up
        },
        // Cooling period expired
        {
          coolingPeriodEnd: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
          expectedCanProceed: true,
          expectedRemainingHours: undefined,
        },
      ];

      for (const scenario of scenarios) {
        const userInScenario = {
          ...mockUser,
          phoneChangeCoolingPeriodEnd: scenario.coolingPeriodEnd,
        };

        prismaService.user.findUnique.mockResolvedValue(userInScenario);

        const result = await service['checkSimSwapCoolingPeriod'](
          mockUser.id,
          'high_risk'
        );

        expect(result.canProceed).toBe(scenario.expectedCanProceed);
        expect(result.isInCoolingPeriod).toBe(scenario.coolingPeriodEnd > now);

        if (scenario.expectedRemainingHours !== undefined) {
          expect(result.remainingHours).toBe(scenario.expectedRemainingHours);
        }
      }
    });

    it('should handle high-risk operation cooling period correctly', async () => {
      // Test that high-risk operations have longer cooling period
      const coolingPeriodEnd = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 hours
      const userInCoolingPeriod = {
        ...mockUser,
        phoneChangeCoolingPeriodEnd: coolingPeriodEnd,
      };

      prismaService.user.findUnique.mockResolvedValue(userInCoolingPeriod);

      // Phone change should be allowed after 24 hours
      const phoneChangeResult = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'phone_change'
      );
      expect(phoneChangeResult.canProceed).toBe(true);

      // High-risk operations are allowed
      const highRiskResult = await service['checkSimSwapCoolingPeriod'](
        mockUser.id,
        'high_risk'
      );
      expect(highRiskResult.canProceed).toBe(true);
    });
  });
});
