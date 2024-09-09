import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
export enum verificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}
@Entity()
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  licenseNumber: string;

  @Column({ type: 'date' })
  expirationDate: Date;

  @OneToOne(() => User, (user) => user.license)
  @JoinColumn()
  driver: User;

  @Column({
    type: 'enum',
    enum: verificationStatus,
    default: verificationStatus.PENDING,
  })
  status: verificationStatus;
}
