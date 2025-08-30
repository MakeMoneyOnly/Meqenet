import { describe, it, expect } from 'vitest';

import { telemetryConfig } from './telemetry';

describe('Telemetry Configuration', () => {
  it('should have correct service name', () => {
    expect(telemetryConfig.serviceName).toBe('auth-service');
  });

  it('should be enabled', () => {
    expect(telemetryConfig.enabled).toBe(true);
  });

  it('should have required properties', () => {
    expect(telemetryConfig).toHaveProperty('serviceName');
    expect(telemetryConfig).toHaveProperty('enabled');
  });
});
