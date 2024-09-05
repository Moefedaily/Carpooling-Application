import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateCarDto {
  @IsNotEmpty()
  @IsString()
  make: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNotEmpty()
  @IsString()
  licensePlate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  numberOfSeats: number;
}
