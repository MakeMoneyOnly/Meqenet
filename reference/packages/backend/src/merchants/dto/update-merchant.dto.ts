import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  Matches, 
  IsNumber, 
  Min, 
  Max, 
  IsUrl 
} from 'class-validator';

export class UpdateMerchantDto {
  @ApiProperty({ example: 'Abyssinia Electronics', description: 'Merchant business name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'RETAIL', description: 'Type of business', required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ example: 'AA/12345/23', description: 'Trade license number', required: false })
  @IsString()
  @IsOptional()
  tradeLicense?: string;

  @ApiProperty({ example: '0123456789', description: 'TIN number', required: false })
  @IsString()
  @IsOptional()
  tinNumber?: string;

  @ApiProperty({ example: 'Abebe Kebede', description: 'Name of contact person', required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ example: 'contact@abyssiniaelectronics.et', description: 'Business email address', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+251912345678', description: 'Business phone number', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+251[7-9]\d{8}$/, { 
    message: 'Phone number must be a valid Ethiopian number (format: +251xxxxxxxxx)' 
  })
  phoneNumber?: string;

  @ApiProperty({ example: 'Bole Road, Addis Ababa', description: 'Business address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Addis Ababa', description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Addis Ababa', description: 'State/Region', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'Ethiopia', description: 'Country', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 2.5, description: 'Commission rate percentage', required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiProperty({ example: 'WEEKLY', description: 'Settlement period', required: false })
  @IsString()
  @IsOptional()
  settlementPeriod?: string;

  @ApiProperty({ example: 'https://webhook.abyssiniaelectronics.et/meqenet', description: 'Webhook URL', required: false })
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty({ example: 'https://abyssiniaelectronics.et/logo.png', description: 'Logo URL', required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: 'https://abyssiniaelectronics.et', description: 'Website URL', required: false })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;
}
