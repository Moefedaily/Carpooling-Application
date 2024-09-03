import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @IsStrongPassword()
  password: string;
}
