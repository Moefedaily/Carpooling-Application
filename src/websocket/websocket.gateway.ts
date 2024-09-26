import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { Message } from 'src/messages/entities/message.entity';

@UseGuards(WsJwtGuard)
@WebSocketGateway(3333, { cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger(WebsocketGateway.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`Client attempting to connect: ${client.id}`);
    this.logger.debug(`Handshake data: ${JSON.stringify(client.handshake)}`);

    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    this.logger.debug(
      `Extracted token: ${token ? token.substring(0, 10) + '...' : 'No token'}`,
    );

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
}
