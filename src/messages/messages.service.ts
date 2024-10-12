import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Trip } from '../trips/entities/trip.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { TripsService } from 'src/trips/trips.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    private tripsService: TripsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const { content, senderId, tripId, conversationId } = createMessageDto;

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });

    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['driver'],
    });

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['passenger'],
    });

    if (!sender || !trip || !conversation) {
      throw new NotFoundException('User, Trip, or Conversation not found');
    }

    let receiver: User;
    if (senderId === trip.driver.id) {
      receiver = conversation.passenger;
    } else {
      receiver = trip.driver;
    }
    const isPassenger = await this.tripsService.isUserPassenger(
      senderId,
      tripId,
    );

    const message = this.messageRepository.create({
      content,
      sender,
      receiver,
      trip,
      conversation,
      isFromConfirmedPassenger: isPassenger,
    });

    const savedMessage = await this.messageRepository.save(message);
    this.websocketGateway.emitNewMessage(savedMessage);

    return savedMessage;
  }

  async findMessagesForConversation(
    conversationId: number,
  ): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender', 'receiver'],
      order: { sentAt: 'ASC' },
    });
  }

  async markAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver'],
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.receiver.id !== userId && message.sender.id !== userId) {
      throw new BadRequestException(
        'Not authorized to mark this message as read',
      );
    }
    message.isRead = true;
    return this.messageRepository.save(message);
  }
  async getUnreadCount(userId: number): Promise<number> {
    return this.messageRepository.count({
      where: { receiver: { id: userId }, isRead: false },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.messageRepository.update(
      { receiver: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async getRecentMessagesForUser(userId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: [{ receiver: { id: userId } }],
      relations: ['sender', 'receiver', 'conversation', 'trip'],
      order: { sentAt: 'DESC' },
      take: 5,
    });
  }
}
