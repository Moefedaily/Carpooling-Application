import { Role } from 'src/roles/entities/role.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

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
  @JoinTable()
  trips: Trip[];
}
