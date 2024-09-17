import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsNotEmpty()
  @IsDateString()
  expirationDate: string;

  @IsOptional()
  @IsNumber()
  driverId: number;
}
