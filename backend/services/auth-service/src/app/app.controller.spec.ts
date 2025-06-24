import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
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
      // Mock the service method
      jest
        .spyOn(appService, 'getHealthCheck')
        .mockImplementation(() => healthCheckStatus);

      expect(appController.getHealthCheck()).toBe(healthCheckStatus);
    });
  });
});
