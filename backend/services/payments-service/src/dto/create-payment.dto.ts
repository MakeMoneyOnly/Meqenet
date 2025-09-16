import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

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
  /**
   * Monetary amount in minor units (e.g., santim for ETB)
   * FinTech best practice: avoid floating point for money
   */
  @IsInt()
  @Min(1)
  amountMinor: number;

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

  @IsString()
  @IsNotEmpty()
  userId: string;
}
