import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
}
