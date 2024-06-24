import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  departureLocation: string;

  @Column()
  arrivalLocation: string;

  @Column()
  departureDate: Date;

  @Column()
  departureTime: Date;

  @Column()
  availableSeats: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerSeat: number;

  @Column('text')
  description: string;

  @Column()
  status: string;

  @ManyToOne(() => User)
  driver: User;

  @ManyToMany(() => User)
  @JoinTable()
  passengers: User[];
}
