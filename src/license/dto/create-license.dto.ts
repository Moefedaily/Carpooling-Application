import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @IsNotEmpty()
  @IsDateString()
  expirationDate: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
