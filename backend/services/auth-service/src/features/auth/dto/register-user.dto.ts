import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

const MIN_PASSWORD_LENGTH = 12; // NBE compliance requirement

export class RegisterUserDto {
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
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: JSON.stringify({
      en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      am: `የይለፍ ቃል ቢያንስ ${MIN_PASSWORD_LENGTH} ቁምፊዎች መሆን አለበት።`,
    }),
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: JSON.stringify({
      en: 'Password must contain uppercase, lowercase, numbers and special characters.',
      am: 'የይለፍ ቃል ካፒታል፣ ትንንሽ ፊደሎች፣ ቁጥሮች እና ልዩ ቁምፊዎች መያዝ አለበት።',
    }),
  })
  password!: string;

  @IsOptional()
  @Matches(/^\+251[79]\d{8}$/, {
    message: JSON.stringify({
      en: 'Invalid Ethiopian phone number format. Please use format: +251XXXXXXXXX',
      am: 'ልክ ያልሆነ የኢትዮጵያ ስልክ ቁጥር ቅርጸት። እባክዎ ይህንን ቅርጸት ይጠቀሙ: +251XXXXXXXXX',
    }),
  })
  phone?: string;

  @IsOptional()
  @Matches(/^\d{12}$/, {
    message: JSON.stringify({
      en: 'Invalid Fayda National ID format. Must be 12 digits.',
      am: 'ልክ ያልሆነ የፋይዳ ብሔራዊ መታወቂያ ቅርጸት። 12 አሃዞች መሆን አለበት።',
    }),
  })
  faydaId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
