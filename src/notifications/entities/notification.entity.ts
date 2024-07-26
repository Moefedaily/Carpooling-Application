import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  type: string; // e.g., 'NEW MESSAGE', 'TRIP UPDATE', 'BOOKING CONFIRMATION'

  @Column({ nullable: true })
  relatedEntityId: number; // e.g., tripId or messageId
}
