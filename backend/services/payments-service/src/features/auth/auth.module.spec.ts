import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  describe('JWT Configuration', () => {
    it('should configure JWT module correctly', () => {
      const jwtModule = module.get(JwtModule);
      expect(jwtModule).toBeDefined();
    });

    it('should configure Passport with JWT strategy', () => {
      const passportModule = module.get(PassportModule);
      expect(passportModule).toBeDefined();
    });
  });
});
