import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

const MIN_PASSWORD_LENGTH = 12; // NBE compliance requirement

export class PasswordResetConfirmDto {
  @IsString({
    message: JSON.stringify({
      en: 'Reset token must be a string.',
      am: 'የያዋቂ ማርከር ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Reset token is required.',
      am: 'የያዋቂ ማርከር ያስፈልጋል።',
    }),
  })
  token!: string;

  @IsString({
    message: JSON.stringify({
      en: 'New password must be a string.',
      am: 'አዲስ የይለፍ ቃል ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'New password is required.',
      am: 'አዲስ የይለፍ ቃል ያስፈልጋል።',
    }),
  })
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: JSON.stringify({
      en: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      am: `አዲስ የይለፍ ቃል ቢያንስ ${MIN_PASSWORD_LENGTH} ቁምፊዎች መሆን አለበት።`,
    }),
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: JSON.stringify({
      en: 'New password must contain uppercase, lowercase, numbers and special characters.',
      am: 'አዲስ የይለፍ ቃል ካፒታል፣ ትንንሽ ፊደሎች፣ ቁጥሮች እና ልዩ ቁምፊዎች መያዝ አለበት።',
    }),
  })
  newPassword!: string;

  @IsString({
    message: JSON.stringify({
      en: 'Password confirmation must be a string.',
      am: 'የይለፍ ቃል ማስተያወቂያ ጽሑፍ መሆን አለበት።',
    }),
  })
  @IsNotEmpty({
    message: JSON.stringify({
      en: 'Password confirmation is required.',
      am: 'የይለፍ ቃል ማስተያወቂያ ያስፈልጋል።',
    }),
  })
  confirmPassword!: string;
}
