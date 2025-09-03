import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthEvent, UserRegisteredPayload } from '../../shared/events';
import { EventService } from '../../shared/services/event.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
    private readonly configService: ConfigService
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
    _context?: { language?: string }
  ): Promise<{ accessToken: string }> {
    const { email, password } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException({
        errorCode: 'USER_ALREADY_EXISTS',
        message: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user with password hash directly in the User model
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
      },
    });

    const eventPayload: UserRegisteredPayload = {
      userId: createdUser.id,
      email: createdUser.email,
      timestamp: new Date().toISOString(),
    };
    await this.eventService.publish(AuthEvent.USER_REGISTERED, eventPayload);

    const payload = {
      sub: createdUser.id,
      email: createdUser.email,
      role: (createdUser as unknown as { role?: string })?.role,
    };
    const issuer = this.configService.get<string>('JWT_ISSUER') || undefined;
    const audience = this.configService.get<string>('JWT_AUDIENCE') || undefined;
    const accessToken = this.jwtService.sign(payload, { issuer, audience });

    return { accessToken };
  }

  async login(
    loginUserDto: LoginUserDto,
    _context?: { language?: string }
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const payload = { sub: user.id, email: user.email, role: (user as any)?.role };
    const issuer = this.configService.get<string>('JWT_ISSUER') || undefined;
    const audience = this.configService.get<string>('JWT_AUDIENCE') || undefined;
    const accessToken = this.jwtService.sign(payload, { issuer, audience });

    return { accessToken };
  }
}
