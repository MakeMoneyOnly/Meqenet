import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
  IsArray,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EmploymentStatus {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  CONTRACT = 'CONTRACT',
  STUDENT = 'STUDENT',
  UNEMPLOYED = 'UNEMPLOYED',
}

export enum IncomeFrequency {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  IRREGULAR = 'IRREGULAR',
}

export class AdditionalIncomeSource {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(IncomeFrequency)
  frequency: IncomeFrequency;

  @IsOptional()
  description?: string;
}

export class CreditAssessmentDto {
  @ApiProperty({
    description: 'Monthly income in ETB',
    example: 15000,
  })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiProperty({
    description: 'Monthly expenses in ETB',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  monthlyExpenses: number;

  @ApiProperty({
    description: 'Employment status',
    enum: EmploymentStatus,
    example: EmploymentStatus.FULL_TIME,
  })
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;

  @ApiProperty({
    description: 'Income frequency',
    enum: IncomeFrequency,
    example: IncomeFrequency.MONTHLY,
  })
  @IsEnum(IncomeFrequency)
  incomeFrequency: IncomeFrequency;

  @ApiProperty({
    description: 'Monthly payments for existing loans in ETB',
    example: 2000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingLoanPayments?: number;

  @ApiProperty({
    description: 'Housing status (OWNED, RENTED, LIVING_WITH_FAMILY)',
    example: 'RENTED',
    required: false,
  })
  @IsOptional()
  @IsString()
  housingStatus?: string;

  @ApiProperty({
    description: 'Years at current employer',
    example: 2.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsAtCurrentEmployer?: number;

  @ApiProperty({
    description: 'Years employed',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsEmployed?: number;

  @ApiProperty({
    description: 'Home ownership status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  homeOwner?: boolean;

  @ApiProperty({
    description: 'Additional income sources',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalIncomeSource)
  additionalIncomeSources?: AdditionalIncomeSource[];
}

export class CreditLimitAdjustmentDto {
  @ApiProperty({
    description: 'New credit limit in ETB',
    example: 20000,
    minimum: 1000,
    maximum: 50000,
  })
  @IsNumber()
  @Min(1000)
  @Max(50000)
  newLimit: number;

  @ApiPropertyOptional({
    description: 'Notes explaining the reason for adjustment',
    example: 'Increased limit due to excellent payment history',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}


