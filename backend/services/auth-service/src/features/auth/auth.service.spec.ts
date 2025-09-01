import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { OutboxService } from '../../shared/outbox/outbox.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

import { AuthService } from './auth.service';


describe('AuthService', () => {
  let service: AuthService;
  let _prismaService: PrismaService;
  let _jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockOutboxService = {
    store: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _jwtService = module.get<JwtService>(JwtService);
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

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async callback => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
        });
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerUserDto.email },
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
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
        passwordHash: '$2b$10$hashedpassword',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginUserDto.email },
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid credentials', async () => {
      const loginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });
});
