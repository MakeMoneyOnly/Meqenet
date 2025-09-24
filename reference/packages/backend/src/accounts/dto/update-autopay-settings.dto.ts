import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAutopaySettingsDto {
  @ApiProperty({ 
    example: true, 
    description: 'Whether autopay is enabled',
    required: true
  })
  @IsBoolean()
  autopayEnabled: boolean;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID of the payment method to use for autopay',
    required: false
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  autopayPaymentMethodId?: string;
}
