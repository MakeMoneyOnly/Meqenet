import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as _uuidv4 } from 'uuid';

describe('Payment Flow (e2e)', () => {
  let app: INestApplication;
  let _prisma: PrismaService;
  let _jwtService: JwtService;
  let userToken: string;
  let merchantToken: string;
  let userId: string;
  let _merchantId: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    _prisma = app.get<PrismaService>(PrismaService);
    _jwtService = app.get<JwtService>(JwtService);

    // Clean the database
    await _prisma.cleanDatabase();

    // Create test user
    const user = await _prisma.user.create({
      data: {
        email: 'test@example.com',
        phoneNumber: '+251912345678',
        password:
          '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password: 'password123'
        role: 'USER',
        emailVerified: true,
        phoneVerified: true,
        userProfile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            country: 'Ethiopia',
            preferredLanguage: 'am',
          },
        },
        account: {
          create: {
            accountNumber: `ACC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            creditLimit: 10000,
            availableCredit: 10000,
            totalOutstanding: 0,
            status: 'ACTIVE',
          },
        },
      },
    });

    userId = user.id;

    // Create test merchant
    const merchant = await _prisma.merchant.create({
      data: {
        name: 'Test Merchant',
        businessType: 'RETAIL',
        contactPerson: 'Merchant Contact',
        email: 'merchant@example.com',
        phoneNumber: '+251987654321',
        country: 'Ethiopia',
        status: 'ACTIVE',
        commissionRate: 0.04,
        settlementPeriod: 'IMMEDIATE',
        bankName: 'Commercial Bank of Ethiopia',
        bankAccountNumber: '1000123456789',
        bankAccountName: 'Test Merchant Ltd',
      },
    });

    _merchantId = merchant.id;

    // Generate tokens
    userToken = _jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    merchantToken = _jwtService.sign({
      sub: merchant.id,
      email: merchant.email,
      role: 'MERCHANT',
    });
  });

  afterAll(async () => {
    await _prisma.cleanDatabase();
    await app.close();
  });

  it('should create a transaction as a merchant', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/transactions/merchant/create')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        userId: userId,
        amount: 1000,
        currency: 'ETB',
        description: 'Test purchase',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('reference');
    expect(response.body).toHaveProperty('status', 'PENDING');
    expect(response.body).toHaveProperty('amount', 1000);

    transactionId = response.body.id;
  });

  it('should process payment for the transaction', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transactions/${transactionId}/process-payment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gateway: 'TELEBIRR',
        returnUrl: 'https://meqenet.et/payment/complete',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('redirectUrl');
    expect(response.body).toHaveProperty('transactionId', transactionId);
  });

  it('should handle payment callback', async () => {
    // Simulate a payment callback from the payment gateway
    const callbackPayload = {
      outTradeNo: transactionId,
      tradeNo: `TRF-${Date.now()}`,
      totalAmount: '1000',
      paymentStatus: 'SUCCESS',
      paymentTime: new Date().toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/payment-gateways/webhook/telebirr/${transactionId}`)
      .send(callbackPayload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
  });

  it('should verify the transaction is completed', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'COMPLETED');
  });

  it('should create a settlement for the merchant', async () => {
    // Get the settlement for the transaction
    const response = await request(app.getHttpServer())
      .get(`/api/v1/settlements/merchant`)
      .set('Authorization', `Bearer ${merchantToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('settlements');
    expect(response.body.settlements.length).toBeGreaterThan(0);

    const settlement = response.body.settlements[0];
    expect(settlement).toHaveProperty('transactionId', transactionId);
    expect(settlement).toHaveProperty('status', 'COMPLETED');

    // Verify the settlement amount (original amount - merchant fee)
    const merchantFee = 1000 * 0.04; // 4% commission
    const expectedSettlementAmount = 1000 - merchantFee;
    expect(settlement).toHaveProperty('amount', expectedSettlementAmount);
  });

  it('should update user credit limit after transaction', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/credit/available`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total', 10000);
    expect(response.body).toHaveProperty('used', 1000);
    expect(response.body).toHaveProperty('available', 9000);
  });
});
