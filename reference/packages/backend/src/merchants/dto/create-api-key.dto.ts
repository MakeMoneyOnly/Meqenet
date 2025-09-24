import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key', description: 'Name of the API key' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: true, description: 'Whether this is a live key or test key', required: false })
  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @ApiProperty({ example: '30d', description: 'Expiration period (e.g., 30d, 90d, 365d)', required: false })
  @IsString()
  @IsOptional()
  expiresIn?: string;
}
