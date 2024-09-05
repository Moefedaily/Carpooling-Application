import { License } from 'src/license/entities/license.entity';
import { Message } from 'src/messages/entities/message.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Trip } from 'src/trips/entities/trip.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  BOTH = 'BOTH',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  lastName: string;

  @Column()
  firstName: string;

  @Column()
  birthDate: string;

  @Column()
  phoneNumber: string;

  @Column()
  paymentMethod: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @ManyToOne(() => Role)
  role: Role;

  @ManyToMany(() => Trip)
  trips: Trip[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Reservation, (reservation) => reservation.passenger)
  reservations: Reservation[];

  @OneToOne(() => License, (license) => license.driver)
  license: License;
}
