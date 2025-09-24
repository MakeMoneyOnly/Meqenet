import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  ValidateNested, 
  IsOptional, 
  Min, 
  IsUrl 
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @ApiProperty({ example: 'SKU123', description: 'Product SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'iPhone 13', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Electronics', description: 'Product category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 50000, description: 'Unit price in ETB' })
  @IsNumber()
  @Min(0)
  unitPriceEtb: number;
}

export class CheckoutDto {
  @ApiProperty({ example: 'ORDER123', description: 'Merchant order reference' })
  @IsString()
  @IsNotEmpty()
  merchantOrderId: string;

  @ApiProperty({ example: 50000, description: 'Total amount in ETB' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'ETB', description: 'Currency', default: 'ETB' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 3, description: 'Number of installments (3, 6, or 12)' })
  @IsEnum([3, 6, 12])
  numberOfInstallments: number;

  @ApiProperty({ example: 'iPhone 13 purchase', description: 'Description of the purchase' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [CheckoutItemDto], description: 'Items in the checkout' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ example: 'https://merchant.com/callback', description: 'Callback URL for payment notifications' })
  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @ApiProperty({ example: 'https://merchant.com/return', description: 'Return URL after payment' })
  @IsUrl()
  @IsOptional()
  returnUrl?: string;

  @ApiProperty({ example: { customField: 'value' }, description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
