import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from 'src/messages/entities/message.entity';

export enum TripStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULL = 'FULL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  departureLocation: string;

  @Column()
  arrivalLocation: string;

  @Column()
  departureDate: string;

  @Column()
  departureTime: string;

  @Column()
  availableSeats: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerSeat: number;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PENDING,
  })
  status: TripStatus;

  @ManyToOne(() => User)
  driver: User;

  @ManyToMany(() => User)
  @JoinTable()
  passengers: User[];

  @OneToMany(() => Message, (message) => message.trip)
  messages: Message[];
}
