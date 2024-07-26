import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  TRIP_UPDATE = 'TRIP_UPDATE',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  TRIP_CREATED = 'TRIP_CREATED',
  PASSENGER_JOINED = 'PASSENGER_JOINED',
  PASSENGER_LEFT = 'PASSENGER_LEFT',
  TRIP_STATUS_UPDATE = 'TRIP_STATUS_UPDATE',
  TRIP_JOINED = 'TRIP_JOINED',
}

export class CreateNotificationDto {
  @IsString()
  content: string;

  @IsNumber()
  userId: number;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNumber()
  @IsOptional()
  relatedEntityId?: number;
}
