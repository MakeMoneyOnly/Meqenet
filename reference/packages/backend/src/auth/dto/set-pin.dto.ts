import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

/**
 * DTO for setting or changing a user's PIN
 * - If setting for the first time, only newPin is required
 * - If changing, currentPin is also required
 */
export class SetPinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  newPin: string;

  @IsString()
  @IsOptional()
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  currentPin?: string;
} 