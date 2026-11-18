import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  department: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  jobTitle: string;

  @IsString()
  @IsIn([
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERN',
    'CASUAL',
  ])
  employmentType: string;

  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsDateString()
  hireDate: string;

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