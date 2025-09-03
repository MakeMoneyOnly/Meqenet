import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// Keep constraints aligned with shared Zod schema to ensure consistency
const TOKEN_MIN_LENGTH = 10;
const TOKEN_MAX_LENGTH = 2048;

export class RefreshTokenDto {
  @IsString({
    message: JSON.stringify({
      en: 'Refresh token must be a string.',
      am: 'የማደስ ቶከን ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Refresh token is required.',
      am: 'የማደስ ቶከን ያስፈልጋል።',
    }),
  })
  @MinLength(TOKEN_MIN_LENGTH, {
    message: JSON.stringify({
      en: 'Refresh token too short.',
      am: 'የማደስ ቶከን እጅግ አጭር ነው።',
    }),
  })
  @MaxLength(TOKEN_MAX_LENGTH, {
    message: JSON.stringify({
      en: 'Refresh token too long.',
      am: 'የማደስ ቶከን እጅግ ረጅም ነው።',
    }),
  })
  refreshToken!: string;
}
