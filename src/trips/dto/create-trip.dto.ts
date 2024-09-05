import {
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { TripStatus } from '../entities/trip.entity';

export class CreateTripDto {
  @IsString()
  departureLocation: string;

  @IsString()
  arrivalLocation: string;

  @IsDateString()
  departureDate: string;

  @IsString()
  departureTime: string;

  @IsNumber()
  @IsPositive()
  availableSeats: number;

  @IsNumber()
  @IsPositive()
  pricePerSeat: number;

  @IsString()
  description: string;

  @IsEnum(TripStatus)
  status: TripStatus = TripStatus.PENDING;

  @IsNotEmpty()
  @IsNumber()
  carId: number;
}
