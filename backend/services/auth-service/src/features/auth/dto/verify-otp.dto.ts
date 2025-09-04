import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsIn } from 'class-validator';

// OTP validation constants
const MIN_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 8;

export class VerifyOtpDto {
  @ApiProperty({ description: 'OTP code' })
  @IsString()
  @Length(MIN_OTP_LENGTH, MAX_OTP_LENGTH)
  code!: string;

  @ApiProperty({ enum: ['sms', 'email'], description: 'Delivery channel used' })
  @IsString()
  @IsIn(['sms', 'email'])
  channel!: 'sms' | 'email';
}
