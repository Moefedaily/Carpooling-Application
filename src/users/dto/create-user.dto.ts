import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsString()
  @MaxLength(20)
  nom: string;

  @IsString()
  @MaxLength(20)
  prenom: string;

  @IsDate()
  date_naissance: Date;

  @MaxLength(15)
  numero_telephone: string;

  @MaxLength(20)
  moyen_paiement: string;

  id_role: number;

  @IsOptional()
  @IsBoolean()
  isInterestedInDriving?: boolean;
}
