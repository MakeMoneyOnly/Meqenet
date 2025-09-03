import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
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
      en: 'Password must be a string.',
      am: 'የይለፍ ቃል ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Password is required.',
      am: 'የይለፍ ቃል ያስፈልጋል።',
    }),
  })
  password!: string;
}
