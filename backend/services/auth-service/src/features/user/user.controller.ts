import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { UserService } from './user.service';
import { UpdatePhoneDto } from './dto/update-phone.dto';

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
  async getMe(@Req() req: Request): Promise<{
    id: string;
    email: string;
    role?: string;
    status?: string;
  } | null> {
    const principal = req.user as { id: string } | undefined;
    if (!principal?.id) return null;
    return this.userService.getSafeProfileById(principal.id);
  }

  /**
   * PATCH /users/me/phone
   * Updates the current authenticated user's phone number.
   */
  @Patch('me/phone')
  @ApiOperation({ summary: 'Update user phone number' })
  @ApiOkResponse({ description: "User's phone number updated successfully." })
  async updatePhoneNumber(
    @Req() req: Request,
    @Body() updatePhoneDto: UpdatePhoneDto
  ): Promise<void> {
    const principal = req.user as { id: string } | undefined;
    if (!principal?.id) return;
    await this.userService.updatePhoneNumber(
      principal.id,
      updatePhoneDto.phone
    );
  }
}
