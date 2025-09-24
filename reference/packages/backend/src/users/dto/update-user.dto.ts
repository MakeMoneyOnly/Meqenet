import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, Matches, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address', required: false })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+251912345678', description: 'Ethiopian phone number', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+251[7-9]\d{8}$/, { 
    message: 'Phone number must be a valid Ethiopian number (format: +251xxxxxxxxx)' 
  })
  phone_number?: string;

  @ApiProperty({ example: 'Abebe', description: 'User first name', required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ example: 'Kebede', description: 'User last name', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: '1990-01-01', description: 'User date of birth', required: false })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;
}