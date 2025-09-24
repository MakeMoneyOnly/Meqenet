import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsUUID, Min, IsObject } from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Merchant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  merchantId: string;

  @ApiProperty({
    example: 'PAYMENT',
    enum: TransactionType,
    description: 'Transaction type',
    default: TransactionType.PAYMENT
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiProperty({
    example: 1000,
    description: 'Transaction amount in ETB',
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'Purchase from Merchant XYZ',
    description: 'Transaction description'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Payment method ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Number of installments',
    example: 3,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;

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
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether to include transaction fee calculation (default: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  includeTransactionFee?: boolean;

  // Legacy fields - kept for backward compatibility
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Payment plan ID (if applicable)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  payment_plan_id?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Installment ID (if applicable)',
    required: false
  })
  @IsUUID()
  @IsOptional()
  installment_id?: string;

  @ApiProperty({
    example: 'TELEBIRR',
    description: 'Payment method used',
    required: false
  })
  @IsString()
  @IsOptional()
  payment_method?: string;

  @ApiProperty({
    example: 'TXN123456789',
    description: 'External reference ID (from payment provider)',
    required: false
  })
  @IsString()
  @IsOptional()
  external_reference?: string;
}