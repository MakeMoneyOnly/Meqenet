import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsUUID, IsUrl } from 'class-validator';
import { BNPLProduct, PaymentMethod } from '@prisma/client';

export class CreateContractDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  merchantId: string;

  @IsEnum(BNPLProduct)
  product: BNPLProduct;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(100000)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  merchantReference?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  deviceFingerprint?: string;
}
