import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users/me
   * Returns the current authenticated user's profile.
   */
  @Get('me')
  @ApiOkResponse({ description: 'Current user profile' })
  async getMe(
    @Req() req: Request
  ): Promise<{
    id: string;
    email: string;
    role?: string;
    status?: string;
  } | null> {
    const principal = req.user as { id: string } | undefined;
    if (!principal?.id) return null;
    return this.userService.getSafeProfileById(principal.id);
  }
}
