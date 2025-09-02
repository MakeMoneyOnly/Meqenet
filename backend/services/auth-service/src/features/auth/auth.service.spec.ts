import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { OutboxService } from '../../shared/outbox/outbox.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EventService } from '../../shared/services/event.service';

import { AuthService } from './auth.service';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let _prismaService: PrismaService;
  let _jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockJwtService = {
    sign: vi.fn(),
  };

  const mockOutboxService = {
    store: vi.fn(),
  };

  const mockEventService = {
    publish: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
        {
          provide: MessagingProducerService,
          useValue: {},
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // Mock the prisma property directly on the service instance
    (service as any).prisma = mockPrismaService;
    (service as any).jwtService = mockJwtService;
    (service as any).outboxService = mockOutboxService;
    (service as any).eventService = mockEventService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      // Mock bcrypt.hash for registration
      const bcryptHashMock = vi.mocked(bcrypt.hash);
      bcryptHashMock.mockResolvedValue('hashed-password');

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(mockUser),
          },
        });
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerUserDto.email },
      });
      expect(mockEventService.publish).toHaveBeenCalledWith(
        'user.registered',
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
        })
      );
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(bcryptHashMock).toHaveBeenCalledWith(registerUserDto.password, 12);
    });

    it('should throw error if user already exists', async () => {
      const registerUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      });

      await expect(service.register(registerUserDto)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        credential: {
          hashedPassword: '$2b$10$hashedpassword',
        },
        createdAt: new Date(),
      };

      // Mock bcrypt.compare to return true for valid password
      const bcryptCompareMock = vi.mocked(bcrypt.compare);
      bcryptCompareMock.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginUserDto.email },
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        loginUserDto.password,
        mockUser.credential.hashedPassword
      );
    });

    it('should throw error for invalid credentials', async () => {
      const loginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        credential: {
          hashedPassword: '$2b$10$hashedpassword',
        },
        createdAt: new Date(),
      };

      // Mock bcrypt.compare to return false for invalid password
      const bcryptCompareMock = vi.mocked(bcrypt.compare);
      bcryptCompareMock.mockResolvedValue(false as never);

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        loginUserDto.password,
        mockUser.credential.hashedPassword
      );
    });
  });
});
