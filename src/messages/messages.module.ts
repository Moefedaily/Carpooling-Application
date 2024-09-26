import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { MessageController } from './messages.controller';
import { MessageService } from './messages.service';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { TripsModule } from 'src/trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, User, Trip]),
    NotificationsModule,
    WebsocketModule,
    TripsModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessagesModule {}
