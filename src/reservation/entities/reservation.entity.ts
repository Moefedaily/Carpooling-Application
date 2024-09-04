import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  reservationDate: Date;

  @Column()
  numberOfSeats: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => Trip, (trip) => trip.reservations)
  trip: Trip;

  @ManyToOne(() => User, (user) => user.reservations)
  passenger: User;
}
