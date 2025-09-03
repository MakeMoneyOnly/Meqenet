import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PasswordResetRequestDto {
  @IsEmail(
    {},
    {
      message: JSON.stringify({
        en: 'Please provide a valid email address.',
        am: 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያቅርቡ።',
      }),
    }
  )
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Email address is required.',
      am: 'የኢሜይል አድራሻ ያስፈልጋል።',
    }),
  })
  email!: string;

  @IsString({
    message: JSON.stringify({
      en: 'Client identifier must be a string.',
      am: 'የያህል መለያ ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Client identifier is required.',
      am: 'የያህል መለያ ያስፈልጋል።',
    }),
  })
  clientId!: string;
}
