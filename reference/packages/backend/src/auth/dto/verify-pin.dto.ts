import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * DTO for verifying a user's PIN
 */
export class VerifyPinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  pin: string;
} 