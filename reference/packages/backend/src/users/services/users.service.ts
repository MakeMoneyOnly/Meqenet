import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async create(data: any): Promise<PrismaUser> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<PrismaUser> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // In a real application, you would store refresh tokens in Redis or a database table
  // This is a simplified implementation for demonstration purposes
  private refreshTokens: Map<string, string> = new Map();

  async setRefreshToken(userId: string, token: string): Promise<void> {
    this.refreshTokens.set(userId, token);
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const storedToken = this.refreshTokens.get(userId);
    return storedToken === token;
  }

  async removeRefreshToken(userId: string): Promise<void> {
    this.refreshTokens.delete(userId);
  }

  // --- PIN management methods ---
  /**
   * Set or update a user's PIN hash and reset failed attempts
   */
  async setPin(userId: string, pinHash: string): Promise<PrismaUser> {
    return this.update(userId, { pinHash, pinFailedAttempts: 0 });
  }

  /**
   * Increment failed PIN attempts for a user
   */
  async incrementPinFailedAttempts(userId: string): Promise<PrismaUser> {
    const user = await this.findById(userId);
    const failed = (user?.pinFailedAttempts ?? 0) + 1;
    return this.update(userId, { pinFailedAttempts: failed });
  }

  /**
   * Reset failed PIN attempts for a user
   */
  async resetPinFailedAttempts(userId: string): Promise<PrismaUser> {
    return this.update(userId, { pinFailedAttempts: 0 });
  }
}