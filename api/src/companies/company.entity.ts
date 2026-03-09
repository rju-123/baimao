import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  creditCode: string;

  @Column()
  address: string;

  @Column()
  contactName: string;

  @Column()
  contactPhone: string;
}

