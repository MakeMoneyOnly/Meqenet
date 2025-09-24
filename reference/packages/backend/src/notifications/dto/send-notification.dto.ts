import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class SendNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
    example: 'PAYMENT_REMINDER',
  })
  @IsEnum(NotificationType)
  type: string;

  @ApiProperty({
    description: 'User ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Email address to send notification to',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number to send SMS to',
    example: '+251912345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Device token for push notification',
    example: 'exampleDeviceToken123',
  })
  @IsString()
  @IsOptional()
  deviceToken?: string;

  @ApiPropertyOptional({
    description: 'User language preference (default: am)',
    example: 'am',
    enum: ['am', 'en'],
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Data to include in the notification',
    example: {
      merchantName: 'Example Store',
      amount: 1000,
      dueDate: '2023-12-31',
    },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Notification channels to use',
    example: ['sms', 'email', 'push'],
    default: ['sms', 'email', 'push'],
  })
  @IsArray()
  @IsOptional()
  channels?: string[];
}