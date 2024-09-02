import { IsNotEmpty, IsInt, IsEnum, IsNumber, Min } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numberOfSeats: number;

  @IsNotEmpty()
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNotEmpty()
  @IsInt()
  tripId: number;

  @IsNotEmpty()
  @IsInt()
  passengerId: number;
}
