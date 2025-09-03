import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ description: 'Email address to send OTP to', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'E.164 phone to send OTP to (e.g., +2519...)',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('ET')
  phone?: string;

  @ApiProperty({ enum: ['sms', 'email'], description: 'Delivery channel' })
  @IsString()
  @IsIn(['sms', 'email'])
  channel!: 'sms' | 'email';
}
