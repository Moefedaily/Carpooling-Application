import { Module, forwardRef } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { MessagesModule } from 'src/messages/messages.module';
import { TripsModule } from 'src/trips/trips.module';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    AuthModule,
    UsersModule,
    forwardRef(() => TripsModule),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
