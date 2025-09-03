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
import { SecurityMonitoringService } from '../../shared/services/security-monitoring.service';

import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventService: EventService,
    private readonly securityMonitoring: SecurityMonitoringService
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
      this.securityMonitoring.recordRegister('failure');
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

    const payload = { sub: createdUser.id, email: createdUser.email };
    const accessToken = this.jwtService.sign(payload);

    this.securityMonitoring.recordRegister('success');
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
      this.securityMonitoring.recordLogin('failure');
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.securityMonitoring.recordLogin('failure');
      throw new UnauthorizedException({
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.securityMonitoring.recordLogin('success');
    return { accessToken };
  }
}
