import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERN',
    'CASUAL',
  ])
  employmentType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}