import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { VirtualCardStatus } from '@prisma/client';

export class UpdateVirtualCardDto {
  @ApiPropertyOptional({
    description: 'Card holder name',
    example: 'Abebe Bekele',
  })
  @IsString()
  @IsOptional()
  cardHolderName?: string;

  @ApiPropertyOptional({
    description: 'Card limit amount',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  limitAmount?: number;

  @ApiPropertyOptional({
    description: 'Set as default payment method',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Card status',
    enum: VirtualCardStatus,
    example: 'ACTIVE',
  })
  @IsEnum(VirtualCardStatus)
  @IsOptional()
  status?: VirtualCardStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata for the virtual card',
    example: {
      purpose: 'Online shopping',
      category: 'E-commerce',
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
