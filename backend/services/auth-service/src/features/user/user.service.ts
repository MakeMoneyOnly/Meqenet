import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Returns a safe user profile by id with non-sensitive fields only.
   */
  async getSafeProfileById(userId: string): Promise<{
    id: string;
    email: string;
    role?: string;
    status?: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) return null;
    // Cast to the expected shape without sensitive data
    return user as {
      id: string;
      email: string;
      role?: string;
      status?: string;
    };
  }

  async updatePhoneNumber(userId: string, newPhone: string): Promise<void> {
    const userBeforeUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userBeforeUpdate) {
      this.logger.warn(`User with id ${userId} not found`);
      return;
    }

    const oldPhone = userBeforeUpdate.phone;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: newPhone,
        phoneUpdatedAt: new Date(),
        phoneVerified: false, // Mark new number as unverified
      },
    });

    this.logger.log(`User ${userId} updated their phone number.`);

    // Emit an event about the change
    this.eventEmitter.emit('user.phone.changed', {
      user: updatedUser,
      oldPhone: oldPhone,
    });
  }
}
