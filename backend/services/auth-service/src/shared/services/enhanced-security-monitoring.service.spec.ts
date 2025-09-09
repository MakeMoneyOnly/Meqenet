import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedSecurityMonitoringService } from './enhanced-security-monitoring.service';
import { SecurityEvent } from './security-monitoring.service';

describe('EnhancedSecurityMonitoringService', () => {
  let service: EnhancedSecurityMonitoringService;
  let loggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnhancedSecurityMonitoringService],
    }).compile();

    service = module.get<EnhancedSecurityMonitoringService>(
      EnhancedSecurityMonitoringService
    );

    // Mock logger to avoid console output during tests
    loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation();
    vi.spyOn(Logger.prototype, 'log').mockImplementation();
    vi.spyOn(Logger.prototype, 'warn').mockImplementation();
    vi.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerSecurityAlert', () => {
    const mockSecurityEvent: SecurityEvent = {
      type: 'authentication',
      severity: 'high',
      userId: 'test-user-id',
      ipAddress: '192.168.1.1',
      correlationId: 'test-correlation-id',
      description: 'Test security event',
      metadata: { testKey: 'testValue' },
      timestamp: new Date(),
    };

    it('should handle critical severity events and trigger all alert mechanisms', async () => {
      const criticalEvent: SecurityEvent = {
        ...mockSecurityEvent,
        severity: 'critical',
      };

      await service.triggerSecurityAlert(criticalEvent);

      // Verify logger calls for alert mechanisms
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle high severity events', async () => {
      const highSeverityEvent: SecurityEvent = {
        ...mockSecurityEvent,
        severity: 'high',
      };

      await service.triggerSecurityAlert(highSeverityEvent);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle medium severity events', async () => {
      const mediumSeverityEvent: SecurityEvent = {
        ...mockSecurityEvent,
        severity: 'medium',
      };

      await service.triggerSecurityAlert(mediumSeverityEvent);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle low severity events', async () => {
      const lowSeverityEvent: SecurityEvent = {
        ...mockSecurityEvent,
        severity: 'low',
      };

      await service.triggerSecurityAlert(lowSeverityEvent);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle events without userId', async () => {
      const eventWithoutUserId: SecurityEvent = {
        ...mockSecurityEvent,
        userId: undefined,
      };

      await service.triggerSecurityAlert(eventWithoutUserId);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle events without ipAddress', async () => {
      const eventWithoutIpAddress: SecurityEvent = {
        ...mockSecurityEvent,
        ipAddress: undefined,
      };

      await service.triggerSecurityAlert(eventWithoutIpAddress);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle events with empty metadata', async () => {
      const eventWithEmptyMetadata: SecurityEvent = {
        ...mockSecurityEvent,
        metadata: {},
      };

      await service.triggerSecurityAlert(eventWithEmptyMetadata);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle events with undefined metadata', async () => {
      const eventWithUndefinedMetadata: SecurityEvent = {
        ...mockSecurityEvent,
        metadata: undefined,
      };

      await service.triggerSecurityAlert(eventWithUndefinedMetadata);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY ALERT'),
        expect.any(Object)
      );
    });

    it('should handle different event types', async () => {
      const eventTypes: SecurityEvent['type'][] = [
        'authentication',
        'authorization',
        'rate_limit',
        'threat_detection',
        'anomaly',
        'encryption',
        'decryption',
      ];

      for (const eventType of eventTypes) {
        const event: SecurityEvent = {
          ...mockSecurityEvent,
          type: eventType,
          description: `Test ${eventType} event`,
        };

        await service.triggerSecurityAlert(event);

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('SECURITY ALERT'),
          expect.any(Object)
        );
      }
    });

    it('should gracefully handle errors in alert mechanisms', async () => {
      // Mock logger to throw error to simulate alert mechanism failure
      const originalLoggerError = Logger.prototype.error;
      Logger.prototype.error = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Logger error');
        })
        .mockImplementation(originalLoggerError);

      await service.triggerSecurityAlert(mockSecurityEvent);

      // Should not throw despite logger error
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('formatAlertMessage', () => {
    it('should format alert message with all fields', () => {
      const event: SecurityEvent = {
        type: 'authentication',
        severity: 'high',
        userId: 'test-user-id',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
        description: 'Test security event',
        metadata: { testKey: 'testValue' },
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      // Access private method for testing
      const formatAlertMessage = (service as any)['formatAlertMessage'].bind(
        service
      );
      const result = formatAlertMessage(event);

      expect(result).toContain('🚨 SECURITY ALERT DETAILS 🚨');
      expect(result).toContain('Event Information:');
      expect(result).toContain('Type: authentication');
      expect(result).toContain('Severity: HIGH');
      expect(result).toContain('Description: Test security event');
      expect(result).toContain('Timestamp: 2023-01-01T12:00:00.000Z');
      expect(result).toContain('User & Location:');
      expect(result).toContain('User ID: test-user-id');
      expect(result).toContain('IP Address: 192.168.1.1');
      expect(result).toContain('User Agent: Mozilla/5.0');
      expect(result).toContain('Correlation ID: test-correlation-id');
      expect(result).toContain('Technical Details:');
      expect(result).toContain('Immediate Actions Required:');
    });

    it('should format alert message with missing optional fields', () => {
      const event: SecurityEvent = {
        type: 'authentication',
        severity: 'high',
        description: 'Test security event',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      };

      const formatAlertMessage = (service as any)['formatAlertMessage'].bind(
        service
      );
      const result = formatAlertMessage(event);

      expect(result).toContain('User ID: N/A');
      expect(result).toContain('IP Address: N/A');
      expect(result).toContain('User Agent: N/A');
      expect(result).toContain('Correlation ID: N/A');
    });

    it('should handle metadata serialization', () => {
      const event: SecurityEvent = {
        type: 'authentication',
        severity: 'high',
        description: 'Test security event',
        timestamp: new Date(),
        metadata: { nested: { data: 'value' }, array: [1, 2, 3] },
      };

      const formatAlertMessage = (service as any).formatAlertMessage.bind(
        service
      );
      const result = formatAlertMessage(event);

      expect(result).toContain('Technical Details:');
      expect(result).toContain('nested');
      expect(result).toContain('data');
      expect(result).toContain('value');
      expect(result).toContain('array');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });
  });

  describe('getSeverityEmoji', () => {
    it('should return correct emoji for each severity level', () => {
      const getSeverityEmoji = (service as any)['getSeverityEmoji'].bind(
        service
      );

      expect(getSeverityEmoji('low')).toBe('🟢');
      expect(getSeverityEmoji('medium')).toBe('🟡');
      expect(getSeverityEmoji('high')).toBe('🔴');
      expect(getSeverityEmoji('critical')).toBe('🚨');
    });

    it('should return default emoji for unknown severity', () => {
      const getSeverityEmoji = (service as any)['getSeverityEmoji'].bind(
        service
      );

      expect(getSeverityEmoji('unknown')).toBe('⚪');
    });
  });

  describe('getSeverityColor', () => {
    it('should return correct color for each severity level', () => {
      const getSeverityColor = (service as any)['getSeverityColor'].bind(
        service
      );

      expect(getSeverityColor('low')).toBe('#36a64f');
      expect(getSeverityColor('medium')).toBe('#ff9500');
      expect(getSeverityColor('high')).toBe('#ff4444');
      expect(getSeverityColor('critical')).toBe('#8B0000');
    });

    it('should return default color for unknown severity', () => {
      const getSeverityColor = (service as any)['getSeverityColor'].bind(
        service
      );

      expect(getSeverityColor('unknown')).toBe('#808080');
    });
  });

  describe('mapSeverityToPriority', () => {
    it('should map severity levels to incident priorities', () => {
      const mapSeverityToPriority = (service as any)[
        'mapSeverityToPriority'
      ].bind(service);

      expect(mapSeverityToPriority('low')).toBe('P4');
      expect(mapSeverityToPriority('medium')).toBe('P3');
      expect(mapSeverityToPriority('high')).toBe('P2');
      expect(mapSeverityToPriority('critical')).toBe('P1');
    });

    it('should return default priority for unknown severity', () => {
      const mapSeverityToPriority = (service as any)[
        'mapSeverityToPriority'
      ].bind(service);

      expect(mapSeverityToPriority('unknown')).toBe('P3');
    });
  });

  describe('shouldTriggerAutomatedResponse', () => {
    it('should trigger automated response for critical severity', () => {
      const shouldTriggerAutomatedResponse = (service as any)[
        'shouldTriggerAutomatedResponse'
      ].bind(service);

      const criticalEvent: SecurityEvent = {
        type: 'authentication',
        severity: 'critical',
        description: 'Critical event',
        timestamp: new Date(),
      };

      expect(shouldTriggerAutomatedResponse(criticalEvent)).toBe(true);
    });

    it('should trigger automated response for high severity with trigger events', () => {
      const shouldTriggerAutomatedResponse = (service as any)[
        'shouldTriggerAutomatedResponse'
      ].bind(service);

      const triggerEvents = [
        'brute_force',
        'suspicious_location',
        'multiple_failed_attempts',
        'rate_limit_exceeded',
        'anomaly_detected',
        'unauthorized_access',
      ];

      for (const trigger of triggerEvents) {
        const event: SecurityEvent = {
          type: 'authentication',
          severity: 'high',
          description: `Event with ${trigger}`,
          timestamp: new Date(),
          metadata: {},
        };

        expect(shouldTriggerAutomatedResponse(event)).toBe(true);
      }
    });

    it('should not trigger automated response for low severity', () => {
      const shouldTriggerAutomatedResponse = (service as any)[
        'shouldTriggerAutomatedResponse'
      ].bind(service);

      const lowSeverityEvent: SecurityEvent = {
        type: 'authentication',
        severity: 'low',
        description: 'Low severity event',
        timestamp: new Date(),
      };

      expect(shouldTriggerAutomatedResponse(lowSeverityEvent)).toBe(false);
    });

    it('should not trigger automated response for medium severity without trigger events', () => {
      const shouldTriggerAutomatedResponse = (service as any)[
        'shouldTriggerAutomatedResponse'
      ].bind(service);

      const mediumSeverityEvent: SecurityEvent = {
        type: 'authentication',
        severity: 'medium',
        description: 'Medium severity event without trigger',
        timestamp: new Date(),
      };

      expect(shouldTriggerAutomatedResponse(mediumSeverityEvent)).toBe(false);
    });
  });

  describe('requiresRegulatoryNotification', () => {
    it('should require regulatory notification for critical events', () => {
      const requiresRegulatoryNotification = (service as any)[
        'requiresRegulatoryNotification'
      ].bind(service);

      const regulatoryEvents = [
        'data_breach',
        'unauthorized_access',
        'system_compromise',
      ];

      for (const eventType of regulatoryEvents) {
        const event: SecurityEvent = {
          type: eventType as any,
          severity: 'critical',
          description: `Critical ${eventType}`,
          timestamp: new Date(),
        };

        expect(requiresRegulatoryNotification(event)).toBe(true);
      }
    });

    it('should not require regulatory notification for non-critical events', () => {
      const requiresRegulatoryNotification = (service as any)[
        'requiresRegulatoryNotification'
      ].bind(service);

      const event: SecurityEvent = {
        type: 'authentication',
        severity: 'high',
        description: 'High severity non-regulatory event',
        timestamp: new Date(),
      };

      expect(requiresRegulatoryNotification(event)).toBe(false);
    });

    it('should not require regulatory notification for non-regulatory critical events', () => {
      const requiresRegulatoryNotification = (service as any)[
        'requiresRegulatoryNotification'
      ].bind(service);

      const event: SecurityEvent = {
        type: 'authentication',
        severity: 'critical',
        description: 'Critical authentication failure',
        timestamp: new Date(),
      };

      expect(requiresRegulatoryNotification(event)).toBe(false);
    });
  });

  describe('assessRegulatoryImpact', () => {
    it('should assess regulatory impact based on severity', () => {
      const assessRegulatoryImpact = (service as any)[
        'assessRegulatoryImpact'
      ].bind(service);

      expect(assessRegulatoryImpact({ severity: 'critical' })).toBe('high');
      expect(assessRegulatoryImpact({ severity: 'high' })).toBe('medium');
      expect(assessRegulatoryImpact({ severity: 'medium' })).toBe('low');
      expect(assessRegulatoryImpact({ severity: 'low' })).toBe('low');
    });
  });
});
