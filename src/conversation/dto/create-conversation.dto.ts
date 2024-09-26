import { IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNumber()
  tripId: number;

  @IsNumber()
  passengerId: number;
}
