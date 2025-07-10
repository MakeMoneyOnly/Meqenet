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

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = appController.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });
  });
});
