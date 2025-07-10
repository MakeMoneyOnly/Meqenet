import 'reflect-metadata';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(() => {
    // Manual dependency injection to work around Vitest DI issues
    appService = new AppService();
    appController = new AppController(appService);

    // Verify manual injection worked
    expect(appController).toBeDefined();
    expect(appService).toBeDefined();
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

    it('should return consistent health check structure', () => {
      const result1 = appController.getHealthCheck();
      const result2 = appController.getHealthCheck();

      // Both should have the same structure
      expect(result1).toHaveProperty('status', 'ok');
      expect(result2).toHaveProperty('status', 'ok');
      expect(typeof result1.timestamp).toBe('string');
      expect(typeof result2.timestamp).toBe('string');
    });
  });
});
