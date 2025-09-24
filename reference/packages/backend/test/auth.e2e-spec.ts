import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { VerificationCodeType } from '../src/auth/enums/verification-code-type.enum';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Test user data
  const testUser = {
    email: 'e2e-test@example.com',
    phoneNumber: '+251911234567',
    password: 'Test@123456',
    firstName: 'E2E',
    lastName: 'Test',
  };

  // Tokens
  let accessToken: string;
  let refreshToken: string;
  let verificationCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean up test user if exists
    await prismaService.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { phoneNumber: testUser.phoneNumber },
        ],
      },
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prismaService.user.deleteMany({
      where: {
        OR: [
          { email: testUser.email },
          { phoneNumber: testUser.phoneNumber },
        ],
      },
    });

    await app.close();
  });

  describe('Registration and Login', () => {
    it('/auth/register (POST) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.phoneNumber).toBe(testUser.phoneNumber);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('password_hash');
        });
    });

    it('/auth/register (POST) - should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          phoneNumber: '+251911234568', // Different phone
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already in use');
        });
    });

    it('/auth/register (POST) - should reject duplicate phone number', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'another-test@example.com', // Different email
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Phone number already in use');
        });
    });

    it('/auth/login (POST) - should login with email and password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('expires_in');
          expect(res.body).toHaveProperty('user_id');

          // Save tokens for later tests
          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;
        });
    });

    it('/auth/login (POST) - should login with phone number and password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.phoneNumber,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('/auth/login (POST) - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.email,
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('Authentication and Authorization', () => {
    it('/auth/profile (GET) - should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('/auth/profile (GET) - should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('/auth/profile (GET) - should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('/auth/refresh (POST) - should refresh access token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('expires_in');

          // Update access token
          accessToken = res.body.access_token;
        });
    });
  });

  describe('Verification Flow', () => {
    it('/auth/verification/email/send (POST) - should send email verification code', () => {
      return request(app.getHttpServer())
        .post('/auth/verification/email/send')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Verification code sent');
        });
    });

    it('should retrieve the verification code from database', async () => {
      // Get user ID from token
      const decodedToken = jwtService.decode(accessToken);
      const userId = decodedToken['sub'];

      // Get verification code from database
      const verificationRecord = await prismaService.verificationCode.findFirst({
        where: {
          userId,
          type: VerificationCodeType.EMAIL,
          isVerified: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(verificationRecord).toBeDefined();
      verificationCode = verificationRecord.code;
    });

    it('/auth/verification/email/verify (POST) - should verify email with code', () => {
      return request(app.getHttpServer())
        .post('/auth/verification/email/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: verificationCode })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Verification successful');
        });
    });

    it('/auth/verification/email/verify (POST) - should reject invalid code', () => {
      return request(app.getHttpServer())
        .post('/auth/verification/email/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'invalid-code' })
        .expect(200) // Still returns 200 but with success: false
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toBe('Invalid verification code');
        });
    });

    it('should confirm email is verified in database', async () => {
      // Get user ID from token
      const decodedToken = jwtService.decode(accessToken);
      const userId = decodedToken['sub'];

      // Get user from database
      const user = await prismaService.user.findUnique({
        where: { id: userId },
      });

      expect(user?.emailVerified).toBe(true);
    });
  });

  describe('Logout', () => {
    it('/auth/logout (POST) - should logout user', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('/auth/refresh (POST) - should reject refresh after logout', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });
  });
});
