import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { PaymentMethodType } from '@prisma/client';

export class CreatePaymentMethodDto {
  @ApiProperty({
    enum: PaymentMethodType,
    example: 'TELEBIRR',
    description: 'Payment method type'
  })
  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  type: PaymentMethodType;

  @ApiProperty({ example: 'My Telebirr Account', description: 'Payment method name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: {
      phone_number: '+251912345678',
      account_name: 'Abebe Kebede'
    },
    description: 'Payment method details (varies by type)'
  })
  @IsObject()
  @IsNotEmpty()
  details: Record<string, any>;

  @ApiProperty({
    example: 'TELEBIRR',
    description: 'Payment provider',
    required: false
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is the default payment method',
    required: false
  })
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this payment method is verified',
    required: false
  })
  @IsOptional()
  isVerified?: boolean;
}