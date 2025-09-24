import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * DTO for resetting a user's PIN (after verifying identity)
 */
export class ResetPinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  newPin: string;

  @IsString()
  @IsNotEmpty()
  verificationCode: string;
} 