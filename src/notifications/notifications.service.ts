import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private usersService: UsersService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(createNotificationDto: {
    content: string;
    userId: number;
    type: string;
    relatedEntityId?: number;
  }): Promise<Notification> {
    const user = await this.usersService.findOne(createNotificationDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = this.notificationsRepository.create({
      ...createNotificationDto,
      user,
    });

    const savedNotification =
      await this.notificationsRepository.save(notification);

    this.websocketGateway.server.to(`user_${user.id}`).emit('newNotification', {
      id: savedNotification.id,
      content: savedNotification.content,
      type: savedNotification.type,
      createdAt: savedNotification.createdAt,
      relatedEntityId: savedNotification.relatedEntityId,
    });

    return savedNotification;
  }

  async findAllForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!notification || notification.user.id !== userId) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async recentNotification(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
  async getUnreadCount(userId: number): Promise<number> {
    const notifications = await this.notificationsRepository.find({
      where: { user: { id: userId }, isRead: false },
    });
    return notifications.length;
  }
}
