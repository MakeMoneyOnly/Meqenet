import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_SALT_ROUNDS = 12;

import { MessagingProducerService } from '../../infrastructure/messaging/messaging.producer.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OutboxService, OutboxMessage } from '../../shared/outbox/outbox.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly messagingProducerService: MessagingProducerService,
    private readonly outboxService: OutboxService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<{ accessToken: string }> {
    const { email, password } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Use a transaction to ensure user and outbox message are created atomically
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
        },
      });

      // Store user registration event in outbox for reliable delivery
      const outboxMessage: OutboxMessage = {
        messageId: uuidv4(),
        aggregateType: 'User',
        aggregateId: createdUser.id,
        eventType: 'USER_REGISTERED',
        payload: {
          email: createdUser.email,
          userId: createdUser.id,
          registeredAt: createdUser.createdAt,
        },
        metadata: {
          correlationId: uuidv4(),
          causationId: uuidv4(),
          source: 'auth-service',
        },
      };

      await this.outboxService.store(outboxMessage, tx);

      return createdUser;
    });

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
