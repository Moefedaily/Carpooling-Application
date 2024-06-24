import {
  IsDateString,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsString()
  @MaxLength(20)
  lastName: string;

  @IsString()
  @MaxLength(20)
  firstName: string;

  @IsDateString()
  birthDate: string;

  @MaxLength(15)
  phoneNumber: string;

  @MaxLength(20)
  paymentMethod: string;
}
