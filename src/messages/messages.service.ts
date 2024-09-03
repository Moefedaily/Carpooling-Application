import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { UsersService } from '../users/users.service';
import { TripsService } from '../trips/trips.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { User } from 'src/users/entities/user.entity';
import { NotificationType } from 'src/notifications/dto/create-notification.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private tripsService: TripsService,
    private notificationsService: NotificationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async createMessage(
    senderId: number,
    tripId: number,
    content: string,
    receiverId?: number,
  ): Promise<Message> {
    const sender = await this.usersService.findOne(senderId);
    const trip = await this.tripsService.findOne(tripId);

    if (!sender || !trip) {
      throw new NotFoundException('User or Trip not found');
    }

    let receiver: User;
    if (senderId === trip.driver.id) {
      if (!receiverId) {
        throw new BadRequestException(
          'Receiver ID is required when driver is sending a message',
        );
      }
      receiver = await this.usersService.findOne(receiverId);
      if (!receiver) {
        throw new NotFoundException('Receiver not found');
      }
    } else {
      receiver = trip.driver;
    }

    const isPassenger = await this.tripsService.isUserPassenger(
      senderId,
      tripId,
    );

    const message = this.messagesRepository.create({
      content,
      sender,
      receiver,
      trip,
      isFromConfirmedPassenger: isPassenger,
    });

    const savedMessage = await this.messagesRepository.save(message);

    await this.notificationsService.create({
      content: `New message from ${sender.lastName}`,
      userId: receiver.id,
      type: NotificationType.NEW_MESSAGE,
      relatedEntityId: savedMessage.id,
    });

    this.websocketGateway.emitNewMessage(savedMessage);

    return savedMessage;
  }
  async findMessagesForTrip(
    tripId: number,
    userId: number,
  ): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { sender: { id: userId }, trip: { id: tripId } },
        { receiver: { id: userId }, trip: { id: tripId } },
      ],
      relations: ['sender', 'receiver'],
      order: { sentAt: 'ASC' },
    });
  }

  async markAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['receiver'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.receiver.id !== userId) {
      throw new NotFoundException(
        'Not authorized to mark this message as read',
      );
    }
    message.isRead = true;
    return this.messagesRepository.save(message);
  }
}
