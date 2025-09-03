import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthEvent, UserRegisteredPayload } from '../../shared/events';
import { EventService } from '../../shared/services/event.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  /**
   * Configurable bcrypt salt rounds for password hashing.
   * Defaults to 12 if env BCRYPT_SALT_ROUNDS is not set or invalid.
   * Bounds chosen for fintech-grade security with balanced performance.
   */
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService
  ) {
    const defaultRounds = 12;
    const envValue = process.env.BCRYPT_SALT_ROUNDS ?? '';
    const parsed = Number.parseInt(envValue, 10);
    // Enforce reasonable bounds to avoid insecure or excessively slow configs
    this.bcryptSaltRounds =
      Number.isFinite(parsed) && parsed >= 10 && parsed <= 15
        ? parsed
        : defaultRounds;
  }

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

    const hashedPassword = await bcrypt.hash(password, this.bcryptSaltRounds);

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

    const payload = { sub: createdUser.id, email: createdUser.email };
    const accessToken = this.jwtService.sign(payload);

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

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
