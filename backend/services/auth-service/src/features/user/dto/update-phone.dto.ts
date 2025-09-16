import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class UpdatePhoneDto {
  @ApiProperty({
    description: 'A valid phone number.',
    example: '+15551234567',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  phone!: string;
}
