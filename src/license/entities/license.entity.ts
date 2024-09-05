import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
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

  @Column({ default: false })
  isVerified: boolean;
}
