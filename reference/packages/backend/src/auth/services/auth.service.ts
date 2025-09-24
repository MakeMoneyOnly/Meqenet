import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User as PrismaUser } from '@prisma/client';

import { UsersService } from '../../users/services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SetPinDto } from '../dto/set-pin.dto';
import { VerifyPinDto } from '../dto/verify-pin.dto';
import { ResetPinDto } from '../dto/reset-pin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(emailOrPhone: string, userPassword: string): Promise<any> {
    // Determine if input is email or phone
    const isEmail = emailOrPhone.includes('@');

    // Find user by email or phone
    const user: PrismaUser | null = isEmail
      ? await this.usersService.findByEmail(emailOrPhone)
      : await this.usersService.findByPhoneNumber(emailOrPhone);

    if (!user) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(userPassword, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Remove sensitive data before returning
    const { password, pinHash, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUserByEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUserByPhone = await this.usersService.findByPhoneNumber(registerDto.phone_number);
    if (existingUserByPhone) {
      throw new ConflictException('Phone number already in use');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const newUser = await this.usersService.create({
      ...registerDto,
      password: passwordHash,
    });

    // Remove sensitive data before returning
    const { password, pinHash, ...result } = newUser;
    return result;
  }

  async login(user: any) {
    return this.generateTokens(user);
  }

  /**
   * Generate access and refresh tokens for a user
   * @param user User object
   * @returns Token response
   */
  async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone_number: user.phoneNumber,
      role: user.role
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    await this.usersService.setRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get<number>('JWT_EXPIRATION'),
      refresh_expires_in: this.configService.get<number>('JWT_REFRESH_EXPIRATION'),
      user_id: user.id,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if token is in our store
      const user = await this.usersService.findById(payload.sub);
      const isValidRefreshToken = await this.usersService.validateRefreshToken(
        payload.sub,
        refreshToken,
      );

      if (!user || !isValidRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email || '',
        phone_number: user.phoneNumber
      };

      return {
        access_token: this.generateAccessToken(newPayload),
        expires_in: this.configService.get<number>('JWT_EXPIRATION'),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Invalidate refresh token
    await this.usersService.removeRefreshToken(userId);
    return null;
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: `${this.configService.get<number>('JWT_EXPIRATION')}s`,
    });
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: `${this.configService.get<number>('JWT_REFRESH_EXPIRATION')}s`,
    });
  }

  /**
   * Set or change a user's PIN
   * - If setting for the first time, only newPin is required
   * - If changing, currentPin is required and must match
   */
  async setPin(userId: string, dto: SetPinDto) {
    const user: PrismaUser | null = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // If user already has a PIN, require currentPin and verify
    if (user.pinHash) {
      if (!dto.currentPin) throw new BadRequestException('Current PIN required');
      const isCurrentValid = await bcrypt.compare(dto.currentPin, user.pinHash);
      if (!isCurrentValid) throw new UnauthorizedException('Current PIN is incorrect');
    }

    // Hash new PIN and save
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const newPinHash = await bcrypt.hash(dto.newPin, saltRounds);
    await this.usersService.setPin(userId, newPinHash);
    return { success: true };
  }

  /**
   * Verify a user's PIN (with lockout after 5 failed attempts)
   */
  async verifyPin(userId: string, dto: VerifyPinDto) {
    const user: PrismaUser | null = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.pinHash) throw new BadRequestException('PIN not set');

    // Lockout after 5 failed attempts
    if ((user.pinFailedAttempts ?? 0) >= 5) {
      throw new UnauthorizedException('Too many failed attempts. Please reset your PIN or contact support.');
    }

    const isValid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!isValid) {
      await this.usersService.incrementPinFailedAttempts(userId);
      throw new UnauthorizedException('Incorrect PIN');
    }

    // Success: reset failed attempts
    await this.usersService.resetPinFailedAttempts(userId);
    return { success: true };
  }

  /**
   * Reset a user's PIN (after verifying identity via code)
   * (Assume verificationCode is checked elsewhere)
   */
  async resetPin(userId: string, dto: ResetPinDto) {
    // TODO: Integrate with verification service to check code
    // For now, assume code is valid
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const newPinHash = await bcrypt.hash(dto.newPin, saltRounds);
    await this.usersService.setPin(userId, newPinHash);
    return { success: true };
  }
}