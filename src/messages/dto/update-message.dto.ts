import { IsBoolean } from 'class-validator';

export class UpdateMessageDto {
  @IsBoolean()
  isRead: boolean;
}
