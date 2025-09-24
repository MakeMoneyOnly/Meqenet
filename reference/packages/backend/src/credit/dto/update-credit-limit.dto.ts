import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateCreditLimitDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'New credit limit in ETB',
    example: 5000,
    minimum: 1000,
    maximum: 50000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  @Max(50000)
  newLimit: number;

  @ApiProperty({
    description: 'Reason for credit limit update',
    example: 'Increased based on payment history',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}