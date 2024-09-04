import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
@Entity()
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  licenseNumber: string;

  @Column({ type: 'date' })
  expirationDate: Date;

  @OneToOne(() => User, (user) => user.license)
  user: User;

  @Column({ default: false })
  isVerified: boolean;

  isValid(): boolean {
    const currentDate = new Date();
    return this.expirationDate > currentDate && this.isVerified;
  }
  getTimeUntilExpiration(): number {
    const currentDate = new Date();
    return this.expirationDate.getTime() - currentDate.getTime();
  }

  isExpiringSoon(daysTilExpir: number = 30): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration();
    const daysUntilExpiration = timeUntilExpiration / (1000 * 60 * 60 * 24);
    return daysUntilExpiration <= daysTilExpir;
  }
}
