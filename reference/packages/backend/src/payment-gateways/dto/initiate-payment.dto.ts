import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, Min, IsEmail, IsUrl, Matches } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'Payment gateway to use',
    example: 'TELEBIRR',
    enum: ['TELEBIRR', 'HELLOCASH', 'CHAPA'],
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['TELEBIRR', 'HELLOCASH', 'CHAPA'], {
    message: 'Gateway must be one of: TELEBIRR, HELLOCASH, CHAPA',
  })
  gateway: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment currency',
    example: 'ETB',
    default: 'ETB',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for order #12345',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Payment reference (generated if not provided)',
    example: 'FLEX-1234567890',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect after payment',
    example: 'https://meqenet.et/payment/complete',
  })
  @IsUrl()
  @IsOptional()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to receive payment notifications',
    example: 'https://api.meqenet.et/api/v1/payment-gateways/callback',
  })
  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'Abebe Kebede',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number (required for some gateways)',
    example: '+251912345678',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+251[7-9]\d{8}$/, {
    message: 'Phone number must be a valid Ethiopian number (format: +251xxxxxxxxx)',
  })
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      orderId: '12345',
      items: [
        { id: '1', name: 'Product 1', price: 500, quantity: 1 },
        { id: '2', name: 'Product 2', price: 500, quantity: 1 },
      ],
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
