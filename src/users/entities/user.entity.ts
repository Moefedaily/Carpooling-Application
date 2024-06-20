import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  date_naissance: Date;

  @Column()
  numero_telephone: string;

  @Column()
  moyen_paiement: string;

  @Column()
  id_role: number;
}
