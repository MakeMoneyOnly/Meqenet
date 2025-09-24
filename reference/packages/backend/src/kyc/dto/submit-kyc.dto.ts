import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { KycDocumentType } from '../enums/kyc.enum';

export class SubmitKycDto {
  @ApiProperty({
    enum: KycDocumentType,
    description: 'Type of document being submitted',
    example: KycDocumentType.FAYDA_ID,
  })
  @IsEnum(KycDocumentType)
  @IsNotEmpty()
  documentType: KycDocumentType;

  @ApiProperty({
    description: 'Document number (ID number, passport number, etc.)',
    example: 'ETH1234567890',
  })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiPropertyOptional({
    description: 'IP address of the user submitting the KYC',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Device information of the user submitting the KYC',
    example: 'iPhone 12, iOS 15.0',
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @ApiPropertyOptional({
    description: 'Additional information for KYC verification',
    example: {
      nationality: 'Ethiopian',
      birthPlace: 'Addis Ababa',
    },
  })
  @IsOptional()
  additionalInfo?: Record<string, any>;
}

export class UpdateKycStatusDto {
  @ApiProperty({
    description: 'New KYC status',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'APPROVED',
  })
  @IsString()
  @IsNotEmpty()
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if status is REJECTED)',
    example: 'Document is not legible',
  })
  @IsString()
  @ValidateIf(o => o.status === 'REJECTED')
  @IsNotEmpty({ message: 'Rejection reason is required when status is REJECTED' })
  reason?: string;
}
