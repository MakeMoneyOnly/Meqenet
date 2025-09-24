import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AccountStatus } from '../enums/account-status.enum';

export class CreateAccountDto {
  @ApiProperty({
    example: 'ETB',
    description: 'Account currency (default: ETB)',
    required: false
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    enum: AccountStatus,
    example: 'ACTIVE',
    description: 'Account status',
    required: false
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}