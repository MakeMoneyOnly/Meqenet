import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsIn } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ description: 'OTP code' })
  @IsString()
  @Length(6, 8)
  code!: string;

  @ApiProperty({ enum: ['sms', 'email'], description: 'Delivery channel used' })
  @IsString()
  @IsIn(['sms', 'email'])
  channel!: 'sms' | 'email';
}
