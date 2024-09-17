import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Trip } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ReservationModule } from 'src/reservation/reservation.module';
import { Car } from 'src/cars/entities/car.entity';
import { License } from 'src/license/entities/license.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, User, Car, License]),
    NotificationsModule,
    ReservationModule,
    AuthModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
