import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  senderId: number;

  @IsNumber()
  @IsNotEmpty()
  tripId: number;

  @IsNumber()
  @IsNotEmpty()
  conversationId: number;
}
