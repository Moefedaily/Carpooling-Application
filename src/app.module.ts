import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TripsModule } from './trips/trips.module';
import { RolesModule } from './roles/roles.module';
import { EmailModule } from './email/email.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ReservationModule } from './reservation/reservation.module';
import { LicenseModule } from './license/license.module';
import { CarsModule } from './cars/cars.module';
import { PaymentModule } from './payment/payment.module';
import { StripeService } from './stripe/stripe.service';
import { StripeModule } from './stripe/stripe.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    DatabaseModule,
    TripsModule,
    RolesModule,
    EmailModule,
    MessagesModule,
    NotificationsModule,
    WebsocketModule,
    ReservationModule,
    LicenseModule,
    CarsModule,
    PaymentModule,
    StripeModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService, StripeService],
})
export class AppModule {}
