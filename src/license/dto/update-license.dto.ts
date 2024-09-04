import { PartialType } from '@nestjs/mapped-types';
import { CreateLicenseDto } from './create-license.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateLicenseDto extends PartialType(CreateLicenseDto) {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
