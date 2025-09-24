import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  NotFoundException,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';

// Define the user request type
interface UserRequest {
  user: {
    id: string;
    role: string;
    email?: string;
    phoneNumber?: string;
    profile?: any;
  };
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req: UserRequest) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Request() req: UserRequest) {
    // Only allow admins or the user themselves to access this endpoint
    if (id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...result } = user;
    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: UserRequest
  ) {
    // Only allow the user themselves to update their profile
    if (id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);
    const { password, ...result } = updatedUser;
    return result;
  }

  @Post(':id/profile')
  @ApiOperation({ summary: 'Create or update user profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createProfile(
    @Param('id') id: string,
    @Body() createProfileDto: CreateUserProfileDto,
    @Request() req: UserRequest
  ) {
    // Only allow the user themselves to create their profile
    if (id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    // In a real implementation, you would create a profile in a separate table
    // For now, we'll just update the user with some of the profile data
    const updateData = {
      // Map profile fields to user fields as needed
      // This is just an example - adjust based on your actual data model
      // We're using any type here since we don't know the exact structure
      ...(createProfileDto as any)
    };

    return this.usersService.update(id, updateData);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile found' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfileById(@Param('id') id: string, @Request() req: UserRequest) {
    // Only allow the user themselves or admins to view profiles
    if (id !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied');
    }

    // Get the user
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // In a real implementation, you would have a separate profile table
    // For now, we'll return a mock profile or user data without sensitive info
    const { password, ...userInfo } = user;
    return {
      userId: id,
      fullName: 'User Name', // Mock data
      address: 'User Address', // Mock data
      ...userInfo
    };
  }
}
