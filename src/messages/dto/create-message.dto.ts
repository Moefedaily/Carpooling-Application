import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  receiverId: number;

  @IsNumber()
  tripId: number;
}
