import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class VerifyPaymentDto {
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
    description: 'Payment ID from the gateway',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Payment reference',
    example: 'FLEX-1234567890',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Transaction ID',
    example: 'TXN1234567890',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}
