import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { PaymentPlanStatus } from '@prisma/client';
import { PaymentPlanType } from '../enums/payment-plan-type.enum';

export class CreatePaymentPlanDto {
  @ApiProperty({ example: 'Purchase at ABC Store', description: 'Description of the payment plan' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 5000, description: 'Total amount in ETB' })
  @IsNumber()
  @Min(100, { message: 'Amount must be at least 100 ETB' })
  total_amount: number;

  @ApiProperty({ example: 3, description: 'Number of installments (3, 6, or 12)' })
  @IsInt()
  @Min(3)
  @Max(12)
  installments: number;

  @ApiProperty({
    enum: PaymentPlanType,
    example: 'STANDARD',
    description: 'Payment plan type',
    required: false
  })
  @IsEnum(PaymentPlanType)
  @IsOptional()
  planType?: PaymentPlanType;

  @ApiProperty({ example: 'ABC123', description: 'Merchant reference ID', required: false })
  @IsString()
  @IsOptional()
  merchantReference?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Merchant ID', required: false })
  @IsString()
  @IsOptional()
  merchant_id?: string;
}