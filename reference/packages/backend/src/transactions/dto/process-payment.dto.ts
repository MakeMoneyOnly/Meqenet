import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Transaction ID to process payment for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

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

  @ApiPropertyOptional({
    description: 'URL to redirect after payment',
    example: 'https://meqenet.et/payment/complete',
  })
  @IsUrl()
  @IsOptional()
  returnUrl?: string;
}
