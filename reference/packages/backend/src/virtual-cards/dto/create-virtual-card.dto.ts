import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateVirtualCardDto {
  @ApiProperty({
    description: 'Card holder name',
    example: 'Abebe Bekele',
  })
  @IsString()
  @IsNotEmpty()
  cardHolderName: string;

  @ApiProperty({
    description: 'Card limit amount',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  limitAmount: number;

  @ApiPropertyOptional({
    description: 'Currency for the virtual card',
    example: 'ETB',
    default: 'ETB',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Set as default payment method',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the virtual card',
    example: {
      purpose: 'Online shopping',
      category: 'E-commerce',
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
