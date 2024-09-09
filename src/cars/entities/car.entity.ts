import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

export enum verificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}
@Entity()
export class Car {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  color: string;

  @Column()
  licensePlate: string;

  @Column()
  numberOfSeats: number;

  @Column({
    type: 'enum',
    enum: verificationStatus,
    default: verificationStatus.PENDING,
  })
  status: verificationStatus;

  @ManyToOne(() => User, (user) => user.cars)
  driver: User;

  @OneToMany(() => Trip, (trip) => trip.car)
  trips: Trip[];
}
