import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = appController.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });
  });
});
