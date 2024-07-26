import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import {
  BadRequestException,
  Inject,
  Logger,
  NotFoundException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { Message } from 'src/messages/entities/message.entity';
import { TripsService } from 'src/trips/trips.service';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger(WebsocketGateway.name);

  constructor(
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private authService: AuthService,
    private usersService: UsersService,
    @Inject(forwardRef(() => TripsService))
    private tripsService: TripsService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`Client attempting to connect: ${client.id}`);
    this.logger.debug(`Handshake data: ${JSON.stringify(client.handshake)}`);

    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn(`No token provided for client ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.authService.validateToken(token);
      this.logger.debug(`Token payload: ${JSON.stringify(payload)}`);

      const user = await this.usersService.findOne(payload.sub);
      this.logger.debug(`User found: ${JSON.stringify(user)}`);

      client.data.user = user;
      client.join(`user_${user.id}`);
      this.logger.debug(
        `User authenticated for client ${client.id}: ${JSON.stringify(user)}`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client['user']) {
      const userId = client['user'].id;
      client.leave(`user_${userId}`);
    }
  }

  emitNewMessage(message: Message) {
    console.log(
      `Emitting message to users ${message.sender.id} and ${message.receiver.id}`,
    );
    this.server
      .to(`user_${message.sender.id}`)
      .to(`user_${message.receiver.id}`)
      .emit('newMessage', message);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { content: string; tripId: number; receiverId?: number },
  ) {
    try {
      if (!client.data.user) {
        throw new Error('User not authenticated');
      }

      const trip = await this.tripsService.findOne(payload.tripId);
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const isDriver = client.data.user.id === trip.driver.id;

      if (isDriver && !payload.receiverId) {
        throw new BadRequestException(
          'Receiver ID is required when driver is sending a message',
        );
      }

      const message = await this.messagesService.createMessage(
        client.data.user.id,
        payload.tripId,
        payload.content,
        isDriver ? payload.receiverId : undefined,
      );

      const senderRoom = `user_${message.sender.id}`;
      const receiverRoom = `user_${message.receiver.id}`;
      this.server.to(senderRoom).to(receiverRoom).emit('newMessage', message);

      this.logger.debug(
        `Emitted newMessage to ${senderRoom} and ${receiverRoom}: ${JSON.stringify(message)}`,
      );

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('tripUpdate')
  handleTripUpdate(client: Socket, payload: { tripId: number; update: any }) {
    this.server.to(`trip_${payload.tripId}`).emit('tripUpdate', payload.update);
    this.logger.debug(`Trip update emitted for trip ${payload.tripId}`);
  }
}
