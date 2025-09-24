import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsEnum, IsString } from 'class-validator';
import { KycStatus } from '../enums/kyc-status.enum';

export class CreateUserProfileDto {
  @ApiProperty({
    example: {
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: '03',
      houseNumber: '123',
    },
    description: 'User address information',
    required: false
  })
  @IsObject()
  @IsOptional()
  address?: Record<string, any>;

  @ApiProperty({
    example: {
      employmentType: 'FULL_TIME',
      employer: 'Ethiopian Airlines',
      position: 'Engineer',
      monthlyIncome: 15000,
    },
    description: 'User employment information',
    required: false
  })
  @IsObject()
  @IsOptional()
  employment_info?: Record<string, any>;

  @ApiProperty({
    enum: KycStatus,
    example: 'PENDING',
    description: 'KYC verification status',
    required: false
  })
  @IsEnum(KycStatus)
  @IsOptional()
  kyc_status?: KycStatus;

  @ApiProperty({
    example: 'FAYDA_ID',
    description: 'Type of KYC document provided',
    required: false
  })
  @IsString()
  @IsOptional()
  kyc_document_type?: string;

  @ApiProperty({
    example: 'ETH123456789',
    description: 'ID number of the KYC document',
    required: false
  })
  @IsString()
  @IsOptional()
  kyc_document_id?: string;
}