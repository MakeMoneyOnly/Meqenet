import 'reflect-metadata';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(() => {
    // Manual dependency injection to work around NestJS+Vitest compatibility issues
    appService = new AppService();
    appController = new AppController(appService);
  });

  describe('getServiceName', () => {
    it('should return the service name "auth-service"', () => {
      expect(appController.getServiceName()).toEqual({ name: 'auth-service' });
    });
  });

  describe('getHealthCheck', () => {
    it('should return the health status from AppService', () => {
      const healthCheckStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      // Mock the service method using Vitest
      vi.spyOn(appService, 'getHealthCheck').mockImplementation(
        () => healthCheckStatus
      );

      expect(appController.getHealthCheck()).toBe(healthCheckStatus);
    });
  });
});
