/// <reference types="vitest" />
import 'reflect-metadata'; // Required for NestJS dependency injection
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    // Manual dependency injection to work around Vitest DI issues
    appService = new AppService();
    appController = new AppController(appService);

    // Verify manual injection worked
    expect(appController).toBeDefined();
    expect(appService).toBeDefined();
  });

  afterEach(() => {
    // Clean up any mocks after each test
    vi.clearAllMocks();
  });

  describe('getServiceName', () => {
    it('should return the service name "auth-service"', () => {
      expect(appController.getServiceName()).toEqual({ name: 'auth-service' });
    });
  });

  describe('getHealthCheck', () => {
    it('should return health status with proper structure', () => {
      const result = appController.getHealthCheck();

      // Verify the structure and content
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      ); // ISO string format
    });

    it('should call AppService getHealthCheck method', () => {
      // Test that the controller properly delegates to the service
      const serviceSpy = vi.spyOn(appService, 'getHealthCheck');

      appController.getHealthCheck();

      expect(serviceSpy).toHaveBeenCalledTimes(1);
    });
  });
});
