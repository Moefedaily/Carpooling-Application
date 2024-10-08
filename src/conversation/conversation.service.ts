import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createConversation(
    tripId: number,
    passengerId: number,
  ): Promise<Conversation> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    const passenger = await this.userRepository.findOne({
      where: { id: passengerId },
    });

    if (!trip || !passenger) {
      throw new NotFoundException('Trip or Passenger not found');
    }

    const conversation = this.conversationRepository.create({
      trip,
      passenger,
    });

    return this.conversationRepository.save(conversation);
  }

  async findConversationsForUser(userId: number): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.find({
      where: [
        { passenger: { id: userId } },
        { trip: { driver: { id: userId } } },
      ],
      relations: ['trip', 'passenger', 'trip.driver', 'messages'],
    });

    return conversations;
  }

  async findConversation(
    tripId: number,
    passengerId: number,
  ): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      where: { trip: { id: tripId }, passenger: { id: passengerId } },
      relations: ['trip', 'passenger'],
    });

    if (!conversation) {
      const trip = await this.tripRepository.findOne({ where: { id: tripId } });
      const passenger = await this.userRepository.findOne({
        where: { id: passengerId },
      });

      if (!trip || !passenger) {
        throw new NotFoundException('Trip or Passenger not found');
      }

      conversation = this.conversationRepository.create({ trip, passenger });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }
}
