import { IsString, IsNotEmpty, IsNumber, IsPositive, MinLength, MaxLength, IsIn } from 'class-validator';

/**
 * Supported currencies for Ethiopian FinTech payments
 */
const SUPPORTED_CURRENCIES = ['ETB'];

/**
 * Validation constants for payment data
 */
const PAYMENT_VALIDATION = {
  MERCHANT_ID_MIN_LENGTH: 5,
  MERCHANT_ID_MAX_LENGTH: 50,
} as const;

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_CURRENCIES)
  currency: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(PAYMENT_VALIDATION.MERCHANT_ID_MIN_LENGTH)
  @MaxLength(PAYMENT_VALIDATION.MERCHANT_ID_MAX_LENGTH)
  merchantId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // e.g., 'telebirr', 'cbe-birr'
}
