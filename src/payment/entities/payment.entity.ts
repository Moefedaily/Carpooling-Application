import { Reservation } from 'src/reservation/entities/reservation.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentDate: Date;

  @Column()
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ManyToOne(() => Reservation)
  reservation: Reservation;

  @Column()
  reservationId: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @Column({ nullable: true })
  stripePaymentIntentId: string;
}
